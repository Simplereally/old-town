# E51-S02 — Server account store and login handshake

## Epic

E51 — Accounts, Login, and Durable Characters

## Dependency chain

- Depends on: E51-S01
- Blocks: E51-S03

## Objective

Real account storage and a working register/login/resume handshake, replacing the `DevAuthValidator` stub in non-dev mode.

## Implementation guidance

- **Account persistence:** extend `PersistenceAdapter` (`apps/server/src/persistence/adapter.ts`) with:
  - `loadAccount(username: string): Promise<AccountRecord | undefined>`
  - `saveAccount(record: AccountRecord): Promise<void>`
  - `AccountRecord = { accountId, username, passwordHash, characterIds: string[], createdAt }` — define with a Zod schema in shared next to `CharacterSnapshot`.
  - Implement for all four kinds: `memory` (Map), `json_file` (extend `jsonStoreSchema` — bump `JSON_STORE_VERSION` to 2 with a migration branch that accepts v1 and adds `accounts: {}`), `postgres` (new `accounts` table via a migration in the `db:migrate` system — read `scripts/db-migrate.ts` to follow the migration file convention), `disabled` (throw or return undefined consistently with existing methods).
- **Password hashing:** `Bun.password.hash(pw, { algorithm: "argon2id" })` / `Bun.password.verify`. Never store or compare plaintext.
- **`RealAuthValidator`** implementing the S01 `AuthValidator` interface:
  - `register`: reject if username exists (`username_taken`); create account with one starter `characterId` (`crypto.randomUUID()`); the character snapshot itself is created lazily by the existing spawn path (dev-session already seeds starter kit when `loadCharacter` returns undefined — reuse exactly that path).
  - `login`: verify hash (`invalid_credentials` on either unknown username or bad password — same error for both, no user enumeration); reject if that account already has a live authenticated connection (`already_online`).
  - `resume`: token lookup (below).
- **`SessionTokenRegistry`** (in-memory, `apps/server/src/net/session-tokens.ts`): `issue(accountId) → token` (`crypto.randomUUID()` is fine), `verify(token) → accountId | undefined`, TTL 24 h refreshed on use, `revoke(accountId)`. In-memory means server restart logs everyone out — acceptable for POC; note it in a comment.
- **Trivial rate limit:** per-connection, max 5 failed auth attempts → close socket (`rate_limited`). No global state needed.
- **Character binding:** on successful auth, the session's `characterId` comes from the account's `characterIds[0]` (single character per account for now; the protocol's `characters[]` array future-proofs the wire format). Wire this into the same place `DevSessionManager` currently decides `session.characterId`.

## Required work

- [ ] Adapter extensions + all four implementations + json-store v1→v2 migration test.
- [ ] Postgres migration + adapter methods, covered in `test:postgres` suite (mirror existing postgres test structure).
- [ ] `RealAuthValidator` + `SessionTokenRegistry` with unit tests: register/login/resume happy paths, duplicate username, wrong password, expired token, `already_online`, rate limit.
- [ ] Config selection: env var (e.g. `OLD_TOWN_AUTH=dev|real`, default `dev`) chooses the validator; document in the server README or `AGENTS.md`.
- [ ] Integration test (fast lane, fake transport): register → AuthResult ok → send MoveIntent → accepted; second connection same account → `already_online`.

## Acceptance criteria

- [ ] Accounts persist across server restarts on `json_file` and `postgres` adapters.
- [ ] Auth error codes are exactly the S01 set; no user enumeration.
- [ ] Dev mode is untouched by default.

## Validation commands

- `bun run test`
- `bun run test:postgres` (with `bun run db:up`)
- `bun run typecheck && bun run lint`

# E51-S01 — Auth protocol types and pre-auth gate

## Epic

E51 — Accounts, Login, and Durable Characters

## Dependency chain

- Depends on: none
- Blocks: E51-S02

## Objective

Define the auth wire protocol in `packages/shared` and make the server transport reject all gameplay intents on unauthenticated connections. No account storage yet — this story can stub verification with a dev-mode "accept anything" validator behind an interface.

## Implementation guidance

- Find where existing C2S intents are defined and validated in `packages/shared` (search: `rg -ln "MoveIntent|ItemIntent" packages/shared/src`). Mirror that exact pattern (Zod schema + TS type + discriminated union registration) for:
  - `AuthIntent`: `{ kind: "register", username, password } | { kind: "login", username, password } | { kind: "resume", token }`. Constraints: username `^[a-z0-9_]{3,16}$` (lowercase at schema level), password length 8–128.
  - `AuthResultPacket` (S2C): `{ ok: true, token, accountId, characters: CharacterSummary[] } | { ok: false, code: "invalid_credentials" | "username_taken" | "invalid_token" | "already_online" | "rate_limited" }`.
  - `CharacterSummary`: `{ characterId, name }` (extend later; keep minimal).
- Note E48 ("wire validation for s2c protocol") is complete — S2C packets have a validation scheme; register `AuthResultPacket` in it the same way other packets are registered.
- Pre-auth gate: in the server transport/session layer (`apps/server/src/net/websocket-transport.ts` and wherever inbound messages are dispatched to intent handlers), add a per-connection `authenticated: boolean`. Before auth, the ONLY accepted message type is `AuthIntent`; anything else → close the socket with a protocol-error code (pick and document a WS close code, e.g. 4401). Passwords must never be logged — audit any message-logging path for this.
- Dev mode: an `AuthValidator` interface `{ verify(intent): Promise<AuthResult> }` with a `DevAuthValidator` that accepts any `login` and fabricates a stable accountId from the username (hash it — same username, same account across restarts). `DevSessionManager` flows keep working through this.

## Required work

- [ ] Shared types + Zod schemas + S2C wire-validation registration, with unit tests in `packages/shared` (parse round-trips, rejection of malformed payloads, password bounds).
- [ ] Pre-auth gate in the transport with tests: unauthenticated `MoveIntent` → socket closed with 4401; `AuthIntent` accepted; post-auth `MoveIntent` accepted. Use the in-memory/fake transport pattern from existing net tests (see `websocket-transport.integration.test.ts` and `apps/server/src/net/__tests__/fake-socket.ts`) — no real ports.
- [ ] `DevAuthValidator` wired as the default so nothing about `bun run dev` changes.

## Acceptance criteria

- [ ] Protocol types exist in shared with full schema validation, deep-importable (`@old-town/shared/...` per AGENTS.md import rule).
- [ ] Gameplay intents are unreachable pre-auth (test-proven).
- [ ] No password ever appears in logs.

## Validation commands

- `bun run test`
- `bun run typecheck`
- `bun run lint`

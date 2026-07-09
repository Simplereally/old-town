# E51 — Accounts, Login, and Durable Characters

## Dependency chain

- Depends on: E45 (Core Gameplay Loop) recommended first; persistence plumbing from earlier epics is already in place
- Unlocks: real multi-session play; prerequisite for any public playtest

## Spec references

- `apps/server/src/persistence/adapter.ts` — `PersistenceAdapter` with kinds `disabled | memory | json_file | postgres`; `loadCharacter`/`saveCharacter` over `CharacterSnapshot`; atomic economy commit on durable adapters
- `apps/server/src/persistence/character-state.ts` — `snapshotCharacter` / `applyCharacterSnapshot`
- `apps/server/src/persistence/dirty-triggers.ts` — existing dirty-tracking
- `apps/server/src/net/dev-session.ts` — current session lifecycle: loads snapshot by `session.characterId` on spawn, saves on despawn, seeds starter kit when no snapshot exists
- `packages/shared` — protocol types live here; all new packets/intents must be defined here with Zod schemas like existing ones
- 🔒 Engineering invariants in `AGENTS.md` (server authoritative; client sends intents only)

## Epic goal

Today identity is a dev-session construct: characters exist only as ad-hoc `characterId`s with no authentication, no reconnect story, and saves only on despawn. This epic adds real accounts (register/login with token resume), binds characters to accounts, autosaves on dirty state, flushes on shutdown, and survives client reconnects — turning the sim into an actual persistent MMO. It reuses the existing adapter/snapshot machinery; the new work is identity, the auth handshake, and lifecycle robustness.

## Scope guardrails

- This is a POC-grade auth system: **username + password (argon2id via Bun.password), opaque session tokens**. No email, no OAuth, no rate-limiting beyond a trivial per-IP attempt counter. Do not gold-plate.
- The `DevSessionManager` path must keep working for local dev (`bun run dev` with no login), selected by config/env — dev mode auto-logs-in a local account.

## Approach summary

1. **Protocol first** (S01): `packages/shared` gains auth message types — the WebSocket connection starts unauthenticated; the first client message must be `AuthIntent` (`register | login | resume`), answered by `AuthResultPacket` carrying a session token and character list. No other intent is processed pre-auth.
2. **Server accounts** (S02): an `AccountStore` on the persistence adapter (new methods, mirroring the character methods) storing `{ accountId, username, passwordHash, characterIds[], createdAt }`, plus an in-memory `SessionTokenRegistry` (token → accountId, TTL-refreshed).
3. **Autosave + shutdown flush** (S03): periodic snapshot save driven by tick count + the dirty-trigger machinery; SIGINT/SIGTERM flushes all online characters before exit.
4. **Reconnect** (S04): a disconnect starts a grace window (e.g. 60 ticks) during which the entity persists and the token can re-attach to it; after the window, normal despawn+save.
5. **Client login UI + e2e** (S05): minimal login/register screen before the game canvas, token cached in localStorage for silent resume, and an end-to-end test covering register → play → disconnect → resume → state intact.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E51/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E51-S01` — [Auth protocol types and pre-auth gate](../stories/E51/E51-S01_auth-protocol-types-and-pre-auth-gate.md)
- [ ] `E51-S02` — [Server account store and login handshake](../stories/E51/E51-S02_server-account-store-and-login-handshake.md)
- [ ] `E51-S03` — [Autosave, dirty triggers, and shutdown flush](../stories/E51/E51-S03_autosave-dirty-triggers-and-shutdown-flush.md)
- [ ] `E51-S04` — [Disconnect grace and session resume](../stories/E51/E51-S04_disconnect-grace-and-session-resume.md)
- [ ] `E51-S05` — [Client login screen and persistence e2e](../stories/E51/E51-S05_client-login-screen-and-persistence-e2e.md)

## Epic acceptance criteria

- [ ] A player can register, log out, log back in on a fresh browser session, and find their character exactly as left (inventory, equipment, skills, position, bank).
- [ ] Kill -INT on the server loses at most the last few ticks of state; restart restores all characters.
- [ ] A dropped WebSocket reconnecting within the grace window resumes the same entity without a despawn/respawn cycle.
- [ ] Unauthenticated connections cannot execute any gameplay intent.
- [ ] `bun run dev` still works with zero login friction (dev auto-login).

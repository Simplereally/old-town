# E51-S04 — Disconnect grace and session resume

## Epic

E51 — Accounts, Login, and Durable Characters

## Dependency chain

- Depends on: E51-S03
- Blocks: E51-S05

## Objective

A dropped WebSocket should not instantly despawn the character. Keep the entity alive for a grace window; a `resume`-token reconnect re-attaches to the same entity seamlessly.

## Implementation guidance

- **Current behavior to change:** find where socket close triggers despawn (dev-session/despawn path saves + removes the entity). Insert a grace stage: on close of an authenticated session, mark the session `lingering` with `graceDeadlineTick = currentTick + GRACE_TICKS` (`GRACE_TICKS = 100` ≈ 60 s, named constant).
- **During grace:** entity remains in the world and is fully simulated (combat can still kill it — that's intentional and OSRS-authentic); input queue is empty so it just stands/finishes its action queue. Interest management continues to broadcast it to others.
- **Expiry:** a per-tick sweep (same end-of-tick phase as autosave) despawns lingering sessions past their deadline via the existing despawn+save path.
- **Resume:** `AuthIntent{ kind: "resume", token }` on a fresh socket → if the account has a lingering session, re-bind the new transport connection to the existing session/entity: swap the socket reference, clear `lingering`, and send the client a full state packet (find how initial `FullStatePacket` is produced for a fresh spawn and reuse that exact function — the client must be able to cold-start rendering from it).
- **Resume with no lingering session:** normal login flow (spawn from snapshot). Same packet shape, so the client doesn't care which happened.
- **`already_online` interaction (from S02):** a live *connected* session rejects a second login; a *lingering* session must instead be resumable — and a fresh `login` (not just resume) during grace should also re-attach rather than reject. Implement both.
- **Death during grace:** if the character dies while lingering, the existing death system handles respawn; the lingering session then lingers at the respawn point. No special-casing.

## Required work

- [ ] Grace lifecycle in the session manager with the tick sweep.
- [ ] Transport re-binding on resume/login-during-grace, with full-state resync.
- [ ] Tests (fake transport, manual ticks):
  - Close socket → entity persists `GRACE_TICKS`, then despawns and saves.
  - Resume within grace → same entityId, no despawn event broadcast, client receives full state.
  - Login (password) within grace → re-attach.
  - Resume after expiry → fresh spawn from the saved snapshot; position matches last autosave/despawn save.
  - Two rapid disconnect/reconnect cycles don't leak sessions or entities (assert registry sizes).

## Acceptance criteria

- [ ] Refreshing the browser mid-game puts the player back in their body without a spawn cycle visible to others.
- [ ] Grace expiry behaves exactly like a clean logout.
- [ ] No session/entity leaks under reconnect churn (test-proven).

## Validation commands

- `bun run test`
- `bun run typecheck && bun run lint`

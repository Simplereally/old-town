# E51-S03 — Autosave, dirty triggers, and shutdown flush

## Epic

E51 — Accounts, Login, and Durable Characters

## Dependency chain

- Depends on: E51-S02
- Blocks: E51-S04

## Objective

Characters currently save only on despawn (`dev-session.ts` ~line 93). Add tick-driven autosave for dirty characters and a shutdown flush so a crash or deploy loses at most seconds of state.

## Implementation guidance

- **Read first:** `apps/server/src/persistence/dirty-triggers.ts` and its test — it already defines what marks a character dirty. This story wires it to a save schedule; do not reinvent dirty detection. If it is not yet invoked from the live tick loop, find the integration point in `apps/server/src/sim/simulation-kernel.ts` (tick phase order is §9 of `POC_SPEC.md` — saves belong after all mutating phases, end of tick).
- **Autosave policy:** every N ticks (N = 50 ≈ 30 s; make it a named constant), snapshot-and-save all characters marked dirty since their last save. Stagger if needed: if > 20 dirty, save in batches across consecutive ticks to avoid a save-spike inside one 600 ms tick budget.
- **Async discipline:** `saveCharacter` is async; the tick loop must NOT await it inline (🔒 600 ms tick). Fire-and-forget with a per-character in-flight guard (skip a character whose previous save hasn't resolved; keep it dirty). Log save failures with backoff, never crash the tick loop.
- **Snapshot at tick boundary:** build the `CharacterSnapshot` synchronously inside the tick (cheap, consistent state), then persist asynchronously. Never read live ECS state from inside the async continuation.
- **Shutdown flush:** on SIGINT/SIGTERM (register in the server entrypoint `apps/server/src/index.ts`): stop accepting connections, run one final synchronous-ish flush (`await Promise.allSettled` of saves for ALL online characters, dirty or not), log the count, then exit. Guard with a 10 s timeout so a hung adapter can't prevent exit.
- **Economy atomicity:** economy mutations already go through the adapter's atomic commit path — do not route them through autosave; autosave covers the character snapshot only. Verify no double-write conflict (read the `EconomyStore` commit comment in `adapter.ts`).

## Required work

- [ ] Autosave scheduler wired into the tick loop end-phase with the in-flight guard and batching.
- [ ] Shutdown flush with timeout.
- [ ] Tests (fast lane, memory adapter, manual tick advancement — no real timers):
  - Dirty character saved after N ticks; clean character not saved.
  - Save still in flight at next interval → skipped, remains dirty, saved next round.
  - Adapter failure → tick loop continues, error surfaced once, retry next interval.
  - Flush saves all online characters and resolves within the timeout.
- [ ] Manual check: `bun run dev:persist`, move around, wait one autosave interval, kill -INT the server, restart, confirm position/inventory restored.

## Acceptance criteria

- [ ] No `await` of persistence inside the tick's critical path.
- [ ] SIGINT loses at most one autosave interval of un-flushed state, and normally nothing.
- [ ] All tests deterministic (tick-count driven).

## Validation commands

- `bun run test`
- `bun run typecheck && bun run lint`

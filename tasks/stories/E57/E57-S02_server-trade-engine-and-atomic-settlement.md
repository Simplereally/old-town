# E57-S02 — Server trade engine and atomic settlement

## Epic

E57 — Player-to-Player Trading

## Dependency chain

- Depends on: E57-S01
- Blocks: E57-S03

## Objective

Drive the S01 machine from the tick loop and settle completed trades through the atomic
economy commit layer.

## Implementation guidance

- **New** `apps/server/src/systems/trade-system.ts` owning a `Map<tradeSessionId, TradeState>`
  plus a `tradeSession` component on both participant entities (entityId ↔ sessionId lookup;
  the component is also what the Interruptions phase and the client delta projector read).
- **Intent routing**: extend the intent dispatcher (see how `dispatchIntentGroup` fans out by
  intent type in `apps/server/src/sim/intent-dispatcher.ts`) to hand `TradeIntent`s to the
  trade system, which converts them to machine events. Per-tick event ordering per S01's rule.
- **Tick phase**: register a `Trade` phase after `Movement` and before
  `SnapshotDeltaBuild` (movement first so "walked away" cancellation sees final positions;
  study `wireTickPhases` ordering, `simulation-kernel.ts:414–581`). Per tick: feed queued
  events, run distance check (> 8 tiles → `owner_moved` event), run timeout check, then
  execute effects.
- **Interruptions integration**: entities with an active `tradeSession` in `offering` or
  `confirming` are added to `blockedOwners` exactly like the dialogue modal
  (`simulation-kernel.ts:429–433`); combat damage against a trading player does NOT block
  (being attacked cancels the trade instead — an effect from a `damaged` event; wire a hook
  from the damage-resolution phase or check HP delta in the trade phase, whichever is less
  invasive — investigate and document).
- **Settlement** (`settle` effect): re-validate the frozen manifest against live inventories
  (uids still present, quantities intact, tradeable, destination space including the outgoing
  slots being freed — compute net space per side); then apply both inventory mutations and
  emit ONE economy commit via the `economyCommit` context capability
  (`simulation-kernel.ts:384–391`) with key `trade:<sessionId>`, ledger rows for every item
  both directions. On adapters without economy support, fall back to the standalone audit path
  (mirror how the bank does it — find `recordEconomicMove`). Any re-validation failure →
  cancel with reason `settlement_failed`, nothing applied.
- **Lifecycle cancels**: disconnect (hook `disconnectSession` cleanup — see the cleanup block
  in `simulation-kernel.ts:703–738`; add trade cancel alongside `actionQueue.cancel`), death
  (death-resolution phase ordering means death processes BEFORE a later trade phase would
  settle — verify order and add an explicit dead-check at settlement).
- **Deltas**: on every state change, push a `TradeStatePacket` per participant through the
  delta accumulator targeted at that entity (find how per-entity-targeted packets flow —
  dialogue state must already do this; mirror it).

## Required work

- [ ] System + phase + dispatcher wiring + Interruptions + lifecycle cancels + settlement.
- [ ] Idempotency: settlement retried after a crash (economy layer replays by key) applies
      once — test against the memory adapter's economy store.
- [ ] Tests: full happy path across two fake sessions; every cancel source; settlement
      re-validation failures (item dropped mid-confirm via a rigged mutation); same-tick
      modify+accept; inventory-space edge (28-slot full swap both ways succeeds; 1-slot-short
      fails cleanly); audit rows correct and paired.

## Acceptance criteria

- [ ] Two scripted sessions complete a trade in integration tests with correct final
      inventories and ONE audited commit.
- [ ] No path exists from `cancelled` to any mutation (assert via test on every cancel).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

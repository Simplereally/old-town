# E05-S05 — Broadcast tick deltas to clients

## Epic

E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E05-S04
- Blocks: next story in `E05` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Send authoritative TickDeltaPacket outputs to each connected client after simulation phases finish.

## Implementation checklist

- [ ] Consume DeltaAccumulator after each tick.
- [ ] Filter deltas through InterestManager.
- [ ] Serialize packets using shared protocol contracts.
- [ ] Add client placeholder handler logging received deltas.
- [ ] Add integration test for two clients seeing each other move.

## Acceptance criteria

- [ ] Server sends one gameplay delta cadence per tick.
- [ ] Client receives movement/entity updates for relevant players.
- [ ] Deltas are not sent for irrelevant entities.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

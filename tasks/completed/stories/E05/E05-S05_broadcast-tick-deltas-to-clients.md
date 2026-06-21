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

- [X] Consume DeltaAccumulator after each tick.
- [X] Filter deltas through InterestManager.
- [X] Serialize packets using shared protocol contracts.
- [X] Add client placeholder handler logging received deltas.
- [X] Add integration test for two clients seeing each other move.

## Acceptance criteria

- [X] Server sends one gameplay delta cadence per tick.
- [X] Client receives movement/entity updates for relevant players.
- [X] Deltas are not sent for irrelevant entities.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

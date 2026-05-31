# E11-S04 — Implement interruptible home teleport

## Epic

E11 — Magic, Projectiles, Line of Sight, and Teleports

## Dependency chain

- Depends on: E11-S03
- Blocks: next story in `E11` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §5
- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §17
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Create a delayed weak action teleport that cancels on movement/combat according to queue semantics.

## Implementation checklist

- [X] Route home teleport spell to weak action with delayTicks.
- [X] Play cast/charging animation and graphic.
- [X] Cancel on movement or combat interruption.
- [X] On complete, set player tile to configured home tile and clear movement path.
- [X] Emit region/chunk loads if destination changes interest area.
- [X] Add tests for completion, movement cancel, combat cancel, and destination update.

## Acceptance criteria

- [X] Teleport uses action queue delay, not async timer.
- [X] Cancelled teleport consumes or refunds resources according to documented content rule.
- [X] Successful teleport sends authoritative position delta.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

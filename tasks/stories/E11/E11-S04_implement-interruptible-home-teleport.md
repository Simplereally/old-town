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

- [ ] Route home teleport spell to weak action with delayTicks.
- [ ] Play cast/charging animation and graphic.
- [ ] Cancel on movement or combat interruption.
- [ ] On complete, set player tile to configured home tile and clear movement path.
- [ ] Emit region/chunk loads if destination changes interest area.
- [ ] Add tests for completion, movement cancel, combat cancel, and destination update.

## Acceptance criteria

- [ ] Teleport uses action queue delay, not async timer.
- [ ] Cancelled teleport consumes or refunds resources according to documented content rule.
- [ ] Successful teleport sends authoritative position delta.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

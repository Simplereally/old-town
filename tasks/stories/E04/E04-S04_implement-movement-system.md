# E04-S04 — Implement movement system

## Epic

E04 — World Map, Collision, Movement, and Pathfinding

## Dependency chain

- Depends on: E04-S03
- Blocks: next story in `E04` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §6
- POC_SPEC.md §11
- POC_SPEC.md §12

## Objective

Process walk/run path queues at one or two tiles per 600ms tick.

## Implementation checklist

- [ ] Add MovementComponent with mode, path, destination, lastStepDirection, blockedUntilTick.
- [ ] Handle MoveIntent by computing and storing server path.
- [ ] Advance walk by 1 tile/tick and run by 2 validated substeps/tick.
- [ ] Cancel weak actions on movement where required.
- [ ] Mark position/facing/move-speed update masks.

## Acceptance criteria

- [ ] Player true tile changes only during movement phase.
- [ ] Blocked next step clears path cleanly.
- [ ] Movement deltas are emitted through DeltaAccumulator.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

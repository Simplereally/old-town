# E03-S05 — Implement action queue system

## Epic

E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E03-S04
- Blocks: next story in `E03` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Objective

Create the tick-based action queue with weak, normal, strong, and soft semantics.

## Implementation checklist

- [ ] Implement ActionQueueEntry with delayTicks, repeat, interruptGroup, payload.
- [ ] Implement enqueue, cancel by group/type, decrement, execute, repeat.
- [ ] Implement interruption semantics for movement/combat/skilling/dialogue/interface.
- [ ] Add tests for weak cancellation, strong clearing, soft guaranteed execution, and repeated actions.
- [ ] Expose debug read model for current queues.

## Acceptance criteria

- [ ] Gameplay delays use ticks, not async sleeps.
- [ ] Action queue behavior matches POC_SPEC.md §10.
- [ ] Repeated actions stop when validator fails.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

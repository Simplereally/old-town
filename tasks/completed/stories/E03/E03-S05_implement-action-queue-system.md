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

- [X] Implement ActionQueueEntry with delayTicks, repeat, interruptGroup, payload.
- [X] Implement enqueue, cancel by group/type, decrement, execute, repeat.
- [X] Implement interruption semantics for movement/combat/skilling/dialogue/interface.
- [X] Add tests for weak cancellation, strong clearing, soft guaranteed execution, and repeated actions.
- [X] Expose debug read model for current queues.

## Acceptance criteria

- [X] Gameplay delays use ticks, not async sleeps.
- [X] Action queue behavior matches POC_SPEC.md §10.
- [X] Repeated actions stop when validator fails.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

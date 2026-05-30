# E03-S03 — Implement 600ms tick loop and phase scheduler

## Epic

E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E03-S02
- Blocks: next story in `E03` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Objective

Create the deterministic tick runner and explicit system phase order from the spec.

## Implementation checklist

- [ ] Implement TickLoop with GAME_TICK_MS.
- [ ] Implement phase registration in fixed order.
- [ ] Expose tick number and server time.
- [ ] Ensure phase errors are logged and fail test/dev deterministically.
- [ ] Add fake-clock tests proving exact tick advancement.

## Acceptance criteria

- [ ] Tick loop uses shared GAME_TICK_MS.
- [ ] System phase order matches POC_SPEC.md §9.1.
- [ ] Tests can run ticks without real timers.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E37-S02 — Extended Object Interaction Routing

## Epic

E37 — Crafting and Content Interaction Expansion

## Dependency chain

- Depends on: E37-S01
- Blocks: E37-S03

## Spec references

- P1 gap 10: Recipe UI / selection runtime
- P1 gap 11: Trapping action runtime
- P1 gap 3: Object non-skilling interaction routing

## Objective

Extend object-interaction-router to handle all remaining actions: smelt, smith, craft, tan, dye, fire, weave, mix, enter, ring, read, inspect, open. Route to appropriate handlers.

## Implementation checklist
- [X] Create/modify: apps/server/src/systems/object-interaction-router.ts
- [X] Create/modify: apps/server/src/systems/door-system.ts
- [X] Create/modify: apps/server/src/ecs/components.ts
- [X] Write test: Each action routing test
- [X] Write test: Door open/close test
- [X] Write test: Out-of-range re-attempt test

## Acceptance criteria
- [X] Each action routing test passes
- [X] Door open/close test passes
- [X] Out-of-range re-attempt test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E37/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

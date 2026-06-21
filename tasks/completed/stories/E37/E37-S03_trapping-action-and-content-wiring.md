# E37-S03 — Trapping Action and Content Wiring

## Epic

E37 — Crafting and Content Interaction Expansion

## Dependency chain

- Depends on: E37-S02
- Blocks: (epic end)

## Spec references

- P1 gap 10: Recipe UI / selection runtime
- P1 gap 11: Trapping action runtime
- P1 gap 3: Object non-skilling interaction routing

## Objective

Implement trapping action: set trap, check trap, tan hides, dye materials. Wire trap entity lifecycle in ECS.

## Implementation checklist
- [X] Create/modify: apps/server/src/systems/trapping-system.ts
- [X] Create/modify: apps/server/src/ecs/components.ts
- [X] Create/modify: apps/server/src/ecs/world.ts
- [X] Create/modify: content/objects/starter-objects.json
- [X] Write test: Set trap test
- [X] Write test: Check trap test
- [X] Write test: Tan action test
- [X] Write test: Dye action test

## Acceptance criteria
- [X] Set trap test passes
- [X] Check trap test passes
- [X] Tan action test passes
- [X] Dye action test passes

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

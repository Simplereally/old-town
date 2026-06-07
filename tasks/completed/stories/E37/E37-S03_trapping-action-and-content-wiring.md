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
- [ ] Create/modify: apps/server/src/systems/trapping-system.ts
- [ ] Create/modify: apps/server/src/ecs/components.ts
- [ ] Create/modify: apps/server/src/ecs/world.ts
- [ ] Create/modify: content/objects/starter-objects.json
- [ ] Write test: Set trap test
- [ ] Write test: Check trap test
- [ ] Write test: Tan action test
- [ ] Write test: Dye action test

## Acceptance criteria
- [ ] Set trap test passes
- [ ] Check trap test passes
- [ ] Tan action test passes
- [ ] Dye action test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E37/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

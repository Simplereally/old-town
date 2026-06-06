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
- [ ] Create/modify: apps/server/src/systems/object-interaction-router.ts
- [ ] Create/modify: apps/server/src/systems/door-system.ts
- [ ] Create/modify: apps/server/src/ecs/components.ts
- [ ] Write test: Each action routing test
- [ ] Write test: Door open/close test
- [ ] Write test: Out-of-range re-attempt test

## Acceptance criteria
- [ ] Each action routing test passes
- [ ] Door open/close test passes
- [ ] Out-of-range re-attempt test passes

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

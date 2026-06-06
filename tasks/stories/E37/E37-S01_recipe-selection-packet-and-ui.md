# E37-S01 — Recipe Selection Packet and UI

## Epic

E37 — Crafting and Content Interaction Expansion

## Dependency chain

- Depends on: (epic start)
- Blocks: E37-S02

## Spec references

- P1 gap 10: Recipe UI / selection runtime
- P1 gap 11: Trapping action runtime
- P1 gap 3: Object non-skilling interaction routing

## Objective

Implement RecipeSelectCommand in command-buffer, wire RecipeSelect intent in intent-dispatcher, validate recipe against station, check materials/levels, and enqueue process action with selected recipe ID.

## Implementation checklist
- [ ] Create/modify: apps/server/src/sim/command-buffer.ts
- [ ] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [ ] Create/modify: apps/server/src/systems/skilling-system.ts
- [ ] Write test: RecipeSelect command parsing test
- [ ] Write test: Recipe validation test
- [ ] Write test: Process with selected recipe test

## Acceptance criteria
- [ ] RecipeSelect command parsing test passes
- [ ] Recipe validation test passes
- [ ] Process with selected recipe test passes

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

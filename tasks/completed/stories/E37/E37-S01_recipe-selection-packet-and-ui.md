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
- [X] Create/modify: apps/server/src/sim/command-buffer.ts
- [X] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [X] Create/modify: apps/server/src/systems/skilling-system.ts
- [X] Write test: RecipeSelect command parsing test
- [X] Write test: Recipe validation test
- [X] Write test: Process with selected recipe test

## Acceptance criteria
- [X] RecipeSelect command parsing test passes
- [X] Recipe validation test passes
- [X] Process with selected recipe test passes

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

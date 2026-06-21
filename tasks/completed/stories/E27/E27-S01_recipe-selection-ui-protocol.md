# E27-S01 — Recipe Selection UI Protocol

## Epic

E27 — Recipe Selection and Crafting

## Dependency chain

- Depends on: E19-S02
- Blocks: E27-S02, E27-S03

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 10)
- docs/content/action-wiring-audit.md (action IDs: `cook`, `smith`, `craft`)
- POC_SPEC.md §9 (Skilling & Processing)

## Objective

Implement the recipe selection UI protocol. When a player uses a crafting station, send available recipes to client and allow selection instead of auto-selecting the first match.

## Implementation checklist

- [X] Write a failing test for recipe protocol in `packages/shared/src/protocol/__tests__/recipe.test.ts`.
- [X] Define recipe selection protocol packets:
  - `RecipeList` (stationId, recipes array)
  - `RecipeSelect` (recipeId)
  - `RecipeResult` (success, itemId, quantity, xp)
- [X] Write a passing test for `RecipeList` serialization.
- [X] Write a passing test for `RecipeSelect` serialization.
- [X] Write a passing test for `RecipeResult` serialization.
- [X] Write a passing test for recipe packet roundtrip.

## Acceptance criteria

- [X] Recipe selection packets are defined and serialized correctly.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E27/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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

- [ ] Write a failing test for recipe protocol in `packages/shared/src/protocol/__tests__/recipe.test.ts`.
- [ ] Define recipe selection protocol packets:
  - `RecipeList` (stationId, recipes array)
  - `RecipeSelect` (recipeId)
  - `RecipeResult` (success, itemId, quantity, xp)
- [ ] Write a passing test for `RecipeList` serialization.
- [ ] Write a passing test for `RecipeSelect` serialization.
- [ ] Write a passing test for `RecipeResult` serialization.
- [ ] Write a passing test for recipe packet roundtrip.

## Acceptance criteria

- [ ] Recipe selection packets are defined and serialized correctly.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E27/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

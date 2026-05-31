# E19-S02 — Define Recipe Selection Protocol

## Epic

E19 — Consumable and Recipe Schema Gaps

## Dependency chain

- Depends on: E19-S01
- Blocks: E19-S03

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §20
- docs/economy/services-and-fees.md

## Objective

Add `recipeId` to crafting command schemas and `recipeGroupId` to `processingRecipeDefSchema`, and write protocol tests.

## Implementation checklist

- [X] Write a failing test for recipe selection protocol in `packages/shared/src/content-schemas/__tests__/recipe.test.ts`.
- [X] Add `recipeId` field to crafting command schemas in `packages/shared/src/protocol/commands.ts`.
- [X] Add `recipeGroupId` field to `processingRecipeDefSchema` in `packages/shared/src/content-schemas/recipe.ts`.
- [X] Define `recipeGroupSchema` with fields: `id`, `name`, `skillId` (reference), `recipes` (array of recipeId references).
- [X] Add `"recipeGroup"` to `CONTENT_DIR_KINDS` and `ContentRegistries` in `packages/shared/src/content-schemas/index.ts`.
- [X] Write a passing test for recipe selection protocol.
- [X] Write a passing test for `recipeGroupSchema` validation.
- [X] Write a passing test for cross-reference validation.

## Acceptance criteria

- [X] Crafting commands include `recipeId` field.
- [X] `processingRecipeDefSchema` includes `recipeGroupId` field.
- [X] `recipeGroupSchema` exists and validates.
- [X] Cross-reference validation catches invalid references.
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
- [X] Move this story file to `tasks/completed/stories/E19/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

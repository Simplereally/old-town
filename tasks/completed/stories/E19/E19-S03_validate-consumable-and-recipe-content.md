# E19-S03 — Validate Consumable and Recipe Content

## Epic

E19 — Consumable and Recipe Schema Gaps

## Dependency chain

- Depends on: E19-S02
- Blocks: none

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- docs/consumables/consumable-system.md

## Objective

Create starter consumable and recipe content, run validation, and ensure cross-references resolve.

## Implementation checklist

- [X] Create starter consumable content in `content/consumables/` (at least 5 definitions: e.g., `health_potion.json`, `mana_potion.json`, `strength_salve.json`, `antidote.json`, `energy_brew.json`).
- [X] Update starter recipe content in `content/recipes/` to include `recipeGroupId` fields.
- [X] Create starter recipe group content in `content/recipe-groups/` (at least 2 definitions: e.g., `cooking.json`, `crafting.json`).
- [X] Add cross-reference validation for consumable `statusEffectId` references.
- [X] Add cross-reference validation for recipe `recipeGroupId` references.
- [X] Write a passing integration test for consumable and recipe content validation.
- [X] Run `bun run content:validate` and fix any errors.

## Acceptance criteria

- [X] Starter consumable content exists and validates.
- [X] Starter recipe content includes `recipeGroupId` fields.
- [X] Starter recipe group content exists and validates.
- [X] `bun run content:validate` passes with zero errors.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run content:validate`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E19/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

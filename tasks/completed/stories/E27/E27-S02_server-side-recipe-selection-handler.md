# E27-S02 — Server-Side Recipe Selection Handler

## Epic

E27 — Recipe Selection and Crafting

## Dependency chain

- Depends on: E27-S01
- Blocks: E27-S03

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 10)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §9 (Skilling & Processing)

## Objective

Implement the server-side recipe selection handler. When a player selects a recipe, validate it, process it, and apply results. Replace auto-selection with explicit selection.

## Implementation checklist

- [X] Write a failing test for recipe selection in `apps/server/src/systems/__tests__/recipe-selection.test.ts`.
- [X] Extend `skilling-system.ts` to handle `RecipeSelect` command.
- [X] Implement recipe validation: check materials, level, tool, station.
- [X] Implement recipe processing: consume materials, calculate success, produce output.
- [X] Implement recipe result: add item, award XP, send result packet.
- [X] Write a passing test for recipe validation.
- [X] Write a passing test for recipe processing.
- [X] Write a passing test for recipe result application.
- [X] Write a passing test for recipe failure handling.

## Acceptance criteria

- [X] Recipe selection is handled server-side.
- [X] All validation checks are performed.
- [X] Recipe processing is atomic.
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
- [ ] Move this story file to `tasks/completed/stories/E27/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

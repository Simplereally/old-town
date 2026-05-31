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

- [ ] Write a failing test for recipe selection in `apps/server/src/systems/__tests__/recipe-selection.test.ts`.
- [ ] Extend `skilling-system.ts` to handle `RecipeSelect` command.
- [ ] Implement recipe validation: check materials, level, tool, station.
- [ ] Implement recipe processing: consume materials, calculate success, produce output.
- [ ] Implement recipe result: add item, award XP, send result packet.
- [ ] Write a passing test for recipe validation.
- [ ] Write a passing test for recipe processing.
- [ ] Write a passing test for recipe result application.
- [ ] Write a passing test for recipe failure handling.

## Acceptance criteria

- [ ] Recipe selection is handled server-side.
- [ ] All validation checks are performed.
- [ ] Recipe processing is atomic.
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

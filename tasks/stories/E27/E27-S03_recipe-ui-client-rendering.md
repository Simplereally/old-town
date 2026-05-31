# E27-S03 — Recipe UI Client Rendering

## Epic

E27 — Recipe Selection and Crafting

## Dependency chain

- Depends on: E27-S02
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 10)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §14 (UI & HUD)

## Objective

Implement the recipe selection UI client rendering. Render a recipe list when using a crafting station, allow selection, and show result feedback.

## Implementation checklist

- [ ] Write a failing test for recipe UI rendering.
- [ ] Implement recipe list panel: show recipe name, required materials, output, level requirement.
- [ ] Implement recipe selection: click to select, highlight selected recipe.
- [ ] Implement make button: send `RecipeSelect` command to server.
- [ ] Implement result feedback: show success/failure, output item, XP gain.
- [ ] Write a passing test for recipe list rendering.
- [ ] Write a passing test for recipe selection.
- [ ] Write a passing test for make button command.
- [ ] Write a passing test for result feedback.

## Acceptance criteria

- [ ] Recipe list is rendered correctly.
- [ ] Recipe selection works.
- [ ] Make button sends command.
- [ ] Result feedback is shown.
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

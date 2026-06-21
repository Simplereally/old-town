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

- [X] Write a failing test for recipe UI rendering.
- [X] Implement recipe list panel: show recipe name, required materials, output, level requirement.
- [X] Implement recipe selection: click to select, highlight selected recipe.
- [X] Implement make button: send `RecipeSelect` command to server.
- [X] Implement result feedback: show success/failure, output item, XP gain.
- [X] Write a passing test for recipe list rendering.
- [X] Write a passing test for recipe selection.
- [X] Write a passing test for make button command.
- [X] Write a passing test for result feedback.

## Acceptance criteria

- [X] Recipe list is rendered correctly.
- [X] Recipe selection works.
- [X] Make button sends command.
- [X] Result feedback is shown.
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

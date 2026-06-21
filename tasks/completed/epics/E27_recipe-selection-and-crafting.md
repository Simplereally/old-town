# E27 — Recipe Selection and Crafting

## Dependency chain

- Depends on: E19
- Unlocks: E28

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 10)
- docs/content/action-wiring-audit.md (action IDs: `cook`, `smith`, `craft`)
- POC_SPEC.md §9 (Skilling & Processing)

## Epic goal

Implement recipe selection UI protocol and server-side recipe handling so players can choose which recipe to craft instead of auto-selecting the first match. This epic closes the gap where the skilling system auto-selects recipes and players have no choice.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E27/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E27-S01` — [Recipe Selection UI Protocol](../completed/stories/E27/E27-S01_recipe-selection-ui-protocol.md)
- [X] `E27-S02` — [Server-Side Recipe Selection Handler](../completed/stories/E27/E27-S02_server-side-recipe-selection-handler.md)
- [X] `E27-S03` — [Recipe UI Client Rendering](../completed/stories/E27/E27-S03_recipe-ui-client-rendering.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

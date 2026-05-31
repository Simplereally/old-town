# E19 — Consumable and Recipe Schema Gaps

## Dependency chain

- Depends on: E18
- Unlocks: E20

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §20
- docs/consumables/consumable-system.md
- docs/economy/services-and-fees.md

## Epic goal

Expand consumable schemas beyond basic healing and define the recipe selection protocol for processing skills. This epic closes the gap where consumables only support heal effects and recipes lack the authoring data needed for player recipe selection during skilling.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E19/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E19-S01` — [Expand Consumable Effects Beyond Heal](stories/E19/E19-S01_expand-consumable-effects-beyond-heal.md)
- [X] `E19-S02` — [Define Recipe Selection Protocol](stories/E19/E19-S02_define-recipe-selection-protocol.md)
- [X] `E19-S03` — [Validate Consumable and Recipe Content](stories/E19/E19-S03_validate-consumable-and-recipe-content.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

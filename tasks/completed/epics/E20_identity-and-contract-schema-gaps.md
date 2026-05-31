# E20 — Identity and Contract Schema Gaps

## Dependency chain

- Depends on: E16, E18, E19
- Unlocks: none

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §10
- POC_SPEC.md §20
- docs/creatures/wardenry-contracts.md
- docs/creatures/wardenry-favour.md

## Epic goal

Define the Wardenry contract schema and create starter contract content. This epic closes the gap where the Wardenry faction is described in lore but has no authored content definitions for bounty-style creature contracts, reputation rewards, or contract completion mechanics.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E20/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E20-S01` — [Define Wardenry Contract Schema](stories/E20/E20-S01_define-wardenry-contract-schema.md)
- [X] `E20-S02` — [Create Contract Content and Validation](stories/E20/E20-S02_create-contract-content-and-validation.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

# E16 — Economy Schema Gaps

## Dependency chain

- Depends on: E15
- Unlocks: E20

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §20
- docs/economy/shop-system.md
- docs/economy/banks-storage-and-reclaim.md
- docs/economy/services-and-fees.md

## Epic goal

Implement missing content schemas for the economy layer: shops, banks, and service fees. This epic closes the gap where the engine has item and inventory systems but no authored content definitions for merchant stock, bank storage, or vendor pricing.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E16/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E16-S01` — [Define Shop Schema](stories/E16/E16-S01_define-shop-schema.md)
- [X] `E16-S02` — [Define Bank Schema](stories/E16/E16-S02_define-bank-schema.md)
- [X] `E16-S03` — [Define Service Fee Schema](stories/E16/E16-S03_define-service-fee-schema.md)
- [X] `E16-S04` — [Validate Economy Content and Cross-References](stories/E16/E16-S04_validate-economy-content-and-cross-references.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

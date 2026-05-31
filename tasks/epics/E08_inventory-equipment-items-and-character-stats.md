# E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E07
- Unlocks: E09

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Epic goal

Implement authoritative item containers, item actions, equipment stat aggregation, consumables, inventory deltas, and character skill/stat state needed by combat and skilling.

## Completion checklist

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E08/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E08-S01` — [Implement inventory container system](../completed/stories/E08/E08-S01_implement-inventory-container-system.md)
- [ ] `E08-S02` — [Implement item action handling](../stories/E08/E08-S02_implement-item-action-handling.md)
- [ ] `E08-S03` — [Implement equipment system](../stories/E08/E08-S03_implement-equipment-system.md)
- [ ] `E08-S04` — [Implement consumables and healing](../stories/E08/E08-S04_implement-consumables-and-healing.md)
- [ ] `E08-S05` — [Implement character skills and derived stats](../stories/E08/E08-S05_implement-character-skills-and-derived-stats.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

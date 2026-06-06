# E39 — World Expansion and Exploration Systems

## Dependency chain

- Depends on: E38
- Unlocks: E40

## Spec references

- P2 gap 11: Ledger deeds
- P2 gap 12: Oldroad Trails
- P2 gap 13: Nooks
- P2 gap 17: Equipment appearance system
- P2 gap 18: Drop table rarity / conditionals
- docs/content/runtime-gap-list.md
- docs/content/action-wiring-audit.md

## Epic goal

World Expansion and Exploration Systems. This epic addresses the remaining gaps in the Old Town vertical slice related to P2 gap 11, P2 gap 12, P2 gap 13, P2 gap 17, P2 gap 18.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E39/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories
- [ ] `E39-S01` — [Equipment Appearance System](stories/E39/E39-S01_equipment-appearance-system.md)
- [ ] `E39-S02` — [Drop Table Rarity and Conditional Drops](stories/E39/E39-S02_drop-table-rarity-and-conditional-drops.md)
- [ ] `E39-S03` — [Ledger Deed and Nook System](stories/E39/E39-S03_ledger-deed-and-nook-system.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

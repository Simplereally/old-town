# E29 — Advanced Status Effects and Combat

## Dependency chain

- Depends on: E18, E23
- Unlocks: E30

## Spec references

- docs/content/runtime-gap-list.md (P2 gaps 22, 25)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §10 (Combat & Status)

## Epic goal

Implement advanced status effects (poison, burn, freeze, buffs/debuffs) and drop table conditionals. This epic closes the gap where the status system only has `bind` and drop tables use flat weight without conditions.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E29/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E29-S01` — [Advanced Status Effect System](completed/stories/E29/E29-S01_advanced-status-effect-system.md)
- [X] `E29-S02` — [Drop Table Rarity and Conditionals](completed/stories/E29/E29-S02_drop-table-rarity-and-conditionals.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

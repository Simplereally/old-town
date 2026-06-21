# E18 — Combat and Status Schema Gaps

## Dependency chain

- Depends on: E15
- Unlocks: E19

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- docs/creatures/wardenry-contracts.md
- docs/consumables/status-effects.md

## Epic goal

Extend the combat content schemas to support creature movement, aggression, drop table conditionals, and status effects. This epic closes the gap where NPCs have basic stats but lack authored definitions for movement patterns, conditional drops, and status effect systems.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E18/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E18-S01` — [Extend Creature Movement and Aggression](stories/E18/E18-S01_extend-creature-movement-and-aggression.md)
- [X] `E18-S02` — [Add Drop Table Conditionals](stories/E18/E18-S02_add-drop-table-conditionals.md)
- [X] `E18-S03` — [Define Status Effects System](stories/E18/E18-S03_define-status-effects-system.md)
- [X] `E18-S04` — [Validate Combat Content](stories/E18/E18-S04_validate-combat-content.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

# E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E01
- Unlocks: E03

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Epic goal

Build the data-driven content layer so gameplay systems consume validated definitions rather than hardcoded item, NPC, object, skill, spell, drop, quest, dialogue, and map logic.

## Completion checklist

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E02/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E02-S01` — [Implement content schema package](../completed/stories/E02/E02-S01_implement-content-schema-package.md)
- [X] `E02-S02` — [Create content loader and dependency validator](../completed/stories/E02/E02-S02_create-content-loader-and-dependency-validator.md)
- [X] `E02-S03` — [Seed core skills and XP table](../completed/stories/E02/E02-S03_seed-core-skills-and-xp-table.md)
- [X] `E02-S04` — [Seed item and equipment definitions](../completed/stories/E02/E02-S04_seed-item-and-equipment-definitions.md)
- [ ] `E02-S05` — [Seed NPCs, objects, resource nodes, and drops](../stories/E02/E02-S05_seed-npcs-objects-resource-nodes-and-drops.md)
- [ ] `E02-S06` — [Seed spellbook, dialogue, quest, and map content](../stories/E02/E02-S06_seed-spellbook-dialogue-quest-and-map-content.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

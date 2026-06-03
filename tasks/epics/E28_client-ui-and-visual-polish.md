# E28 — Client UI and Visual Polish

## Dependency chain

- Depends on: E07, E21, E22, E27
- Unlocks: E29

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 24)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §14 (UI & HUD)

## Epic goal

Implement the equipment appearance system and client visual polish: minimap, XP drops, and equipment-to-appearance mapping. This epic closes the gap where the client has an appearance update stub but no equipment-to-appearance mapping.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E28/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E28-S01` — [Equipment Appearance System](../completed/stories/E28/E28-S01_equipment-appearance-system.md)
- [X] `E28-S02` — [Minimap Rendering](../completed/stories/E28/E28-S02_minimap-rendering.md)
- [X] `E28-S03` — [XP Drop Visualization](../completed/stories/E28/E28-S03_xp-drop-visualization.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

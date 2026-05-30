# E07 — Client Input, Picking, UI Shell, and Debug Tooling

## Dependency chain

- Depends on: E06
- Unlocks: E08

## Spec references

- POC_SPEC.md §7
- POC_SPEC.md §8
- POC_SPEC.md §11
- POC_SPEC.md §12
- POC_SPEC.md §22
- POC_SPEC.md §27

## Epic goal

Make the rendered world playable through click-to-move, tile/entity picking, context menus, basic panels, chat UI, and high-signal debug overlays for invisible server state.

## Completion checklist

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E07/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E07-S01` — [Implement tile picking and move command UX](../stories/E07/E07-S01_implement-tile-picking-and-move-command-ux.md)
- [ ] `E07-S02` — [Implement entity picking and context menu](../stories/E07/E07-S02_implement-entity-picking-and-context-menu.md)
- [ ] `E07-S03` — [Create core UI panels](../stories/E07/E07-S03_create-core-ui-panels.md)
- [ ] `E07-S04` — [Implement debug overlay controls](../stories/E07/E07-S04_implement-debug-overlay-controls.md)
- [ ] `E07-S05` — [Implement UI command routing and feedback messages](../stories/E07/E07-S05_implement-ui-command-routing-and-feedback-messages.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

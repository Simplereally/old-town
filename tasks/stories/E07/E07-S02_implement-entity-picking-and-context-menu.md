# E07-S02 — Implement entity picking and context menu

## Epic

E07 — Client Input, Picking, UI Shell, and Debug Tooling

## Dependency chain

- Depends on: E07-S01
- Blocks: next story in `E07` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §7
- POC_SPEC.md §8
- POC_SPEC.md §11
- POC_SPEC.md §12
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Resolve hovered/clicked actors, NPCs, objects, and ground items into ordered interaction options.

## Implementation checklist

- [ ] Add object/actor/ground item hit targets to renderers.
- [ ] Implement hover highlight.
- [ ] Implement left-click default option selection.
- [ ] Implement right-click context menu with Walk here, Examine, Talk-to, Attack, Chop, Mine, Pick up, Cast where applicable.
- [ ] Send ObjectIntent, NpcIntent, ItemIntent, or SpellIntent from menu selections.

## Acceptance criteria

- [ ] Context menu options come from server/content definitions or client view of those definitions.
- [ ] Interactions still validate server-side.
- [ ] Right-click menu does not block render loop.

## Validation commands

- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

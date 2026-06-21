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

- [X] Add object/actor/ground item hit targets to renderers.
- [X] Implement hover highlight.
- [X] Implement left-click default option selection.
- [X] Implement right-click context menu with Walk here, Examine, Talk-to, Attack, Chop, Mine, Pick up, Cast where applicable.
- [X] Send ObjectIntent, NpcIntent, ItemIntent, or SpellIntent from menu selections.

## Acceptance criteria

- [X] Context menu options come from server/content definitions or client view of those definitions.
- [X] Interactions still validate server-side.
- [X] Right-click menu does not block render loop.

## Validation commands

- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

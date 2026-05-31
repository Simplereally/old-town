# E14-S04 — Implement object, NPC, resource node, and trigger placement

## Epic

E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E14-S03
- Blocks: next story in `E14` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Author placed gameplay entities and triggers visually against validated content definitions.

## Implementation checklist

- [X] Add palette for ObjectDef, NpcDef, ResourceNodeDef, and AreaTriggerDef.
- [X] Place, move, rotate, duplicate, and delete placed objects.
- [X] Place NPC spawns with home tile/wander radius.
- [X] Place resource nodes linked to definitions.
- [X] Place quest/area triggers with IDs and metadata.
- [X] Visualize footprints and reach tiles.

## Acceptance criteria

- [X] Placed entities export with runtime-independent stable placement data.
- [X] Server loads editor-produced region without manual edits.
- [X] Footprints/collision display matches server logic.

## Validation commands

- [X] `bun run world-editor:dev`
- [X] `bun run content:validate`
- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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

- [ ] Add palette for ObjectDef, NpcDef, ResourceNodeDef, and AreaTriggerDef.
- [ ] Place, move, rotate, duplicate, and delete placed objects.
- [ ] Place NPC spawns with home tile/wander radius.
- [ ] Place resource nodes linked to definitions.
- [ ] Place quest/area triggers with IDs and metadata.
- [ ] Visualize footprints and reach tiles.

## Acceptance criteria

- [ ] Placed entities export with runtime-independent stable placement data.
- [ ] Server loads editor-produced region without manual edits.
- [ ] Footprints/collision display matches server logic.

## Validation commands

- [ ] `bun run world-editor:dev`
- [ ] `bun run content:validate`
- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

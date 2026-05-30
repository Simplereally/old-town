# E14-S03 — Implement tile paint and height/collision editing

## Epic

E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E14-S02
- Blocks: next story in `E14` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Allow authoring of terrain material, height, water/bridge flags, and collision masks.

## Implementation checklist

- [ ] Add tile selection brush.
- [ ] Paint underlay/overlay/material.
- [ ] Edit height values.
- [ ] Toggle water/bridge/zone fields.
- [ ] Toggle collision mask bits with visual overlay.
- [ ] Implement undo/redo for tile edits.
- [ ] Validate exported collision flags.

## Acceptance criteria

- [ ] Collision painted in editor matches server CollisionFlag values.
- [ ] Exported edits load in server and client.
- [ ] Undo/redo prevents destructive editing mistakes.

## Validation commands

- [ ] `bun run world-editor:dev`
- [ ] `bun run content:validate`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

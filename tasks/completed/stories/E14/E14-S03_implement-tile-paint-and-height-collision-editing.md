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

- [X] Add tile selection brush.
- [X] Paint underlay/overlay/material.
- [X] Edit height values.
- [X] Toggle water/bridge/zone fields.
- [X] Toggle collision mask bits with visual overlay.
- [X] Implement undo/redo for tile edits.
- [X] Validate exported collision flags.

## Acceptance criteria

- [X] Collision painted in editor matches server CollisionFlag values.
- [X] Exported edits load in server and client.
- [X] Undo/redo prevents destructive editing mistakes.

## Validation commands

- [X] `bun run world-editor:dev`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

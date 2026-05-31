# E14-S02 — Create world editor shell

## Epic

E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E14-S01
- Blocks: next story in `E14` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Build a local tool app for editing regions with Three.js/canvas visualization and file import/export.

## Implementation checklist

- [X] Create tools/world-editor app shell.
- [X] Load content registries and region JSON.
- [X] Render region tiles with chunk/region grid overlays.
- [X] Implement camera/pan/zoom separate from game client if simpler.
- [X] Implement save/export to RegionMapDef JSON.
- [X] Document command to run editor.

## Acceptance criteria

- [X] Editor opens seed region.
- [X] Editor can export a region JSON that passes validation.
- [X] Editor does not depend on live game server.

## Validation commands

- [X] `bun run world-editor:dev`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

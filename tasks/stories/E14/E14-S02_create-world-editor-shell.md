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

- [ ] Create tools/world-editor app shell.
- [ ] Load content registries and region JSON.
- [ ] Render region tiles with chunk/region grid overlays.
- [ ] Implement camera/pan/zoom separate from game client if simpler.
- [ ] Implement save/export to RegionMapDef JSON.
- [ ] Document command to run editor.

## Acceptance criteria

- [ ] Editor opens seed region.
- [ ] Editor can export a region JSON that passes validation.
- [ ] Editor does not depend on live game server.

## Validation commands

- [ ] `bun run world-editor:dev`
- [ ] `bun run content:validate`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

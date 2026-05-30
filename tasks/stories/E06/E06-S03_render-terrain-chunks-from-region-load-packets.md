# E06-S03 — Render terrain chunks from region load packets

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E06-S02
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Convert server region/chunk data into terrain meshes with chunk-level lifecycle management.

## Implementation checklist

- [ ] Create TerrainLayer.
- [ ] Build flat/elevated tile geometry from loaded chunk data.
- [ ] Group or merge terrain by material where practical.
- [ ] Handle chunk load/unload without full scene rebuild.
- [ ] Add placeholder ground materials for grass, dirt, stone, water, and floor.

## Acceptance criteria

- [ ] Loaded region displays as tile terrain.
- [ ] Unloaded chunks remove their meshes and resources.
- [ ] Chunk boundaries can be debug-highlighted.

## Validation commands

- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E42-S02 — Render terrain chunks from region underlay and overlay data

## Epic

E42 — Old Town Terrain and District Identity

## Dependency chain

- Depends on: E42-S01 (Ground Material Registry), E06-S03 (Render terrain chunks from region load packets), E33-S03 (Static Object Instancing)
- Blocks: E42-S03, E42-S04, E42-S05

## Spec references

- `POC_SPEC.md` §4.1 (Coordinate types — `ChunkCoord`, `LocalSceneCoord`)
- `POC_SPEC.md` §6.2 (Client scene rebuild)
- `POC_SPEC.md` §7.2 (Three.js world layers — TerrainLayer)
- `POC_SPEC.md` §7.3 (Renderer rules — instanced/merged terrain)
- `POC_SPEC.md` §23.2 (Art constraints — low-poly, no photoreal PBR)

## Objective

Replace the flat green debug plane with a `TerrainRenderer` that reads the loaded region tile data and builds the terrain layer per chunk. Each tile uses its `underlayId` and optional `overlayId` to pick the correct material color. The result must be a readable, lo-fi town floor instead of an endless green field.

## Required architectural decisions

- **Chunk mesh strategy:** Use `InstancedMesh` per ground material per chunk. This keeps draw calls low and makes chunk rebuilds fast. Each tile is one instance with a world matrix and optional overlay instance.
- **Tile geometry:** One unit square per tile (1 world unit = 1 tile). Vertices align with the integer grid. Use a shared `BoxGeometry` with small height for ground thickness or a flat `PlaneGeometry`.
- **Material:** Use `MeshToonMaterial` or `MeshLambertMaterial` per material ID, created once and reused. No custom shaders.
- **Region loading:** On `S2C_REGION_LOAD`, the client rebuilds the terrain chunk meshes for the region. On `S2C_REGION_UNLOAD`, dispose the chunk meshes.
- **Overlay rendering:** For POC, overlay is rendered as a second thin tile instance slightly above the underlay, using the overlay material color. This keeps the implementation simple and avoids texture blending.

## Implementation checklist

- [X] Create `apps/client/src/renderer/TerrainRenderer.ts` that owns the `TerrainLayer`.
- [X] Create `apps/client/src/renderer/ChunkGeometry.ts` that builds instanced meshes per material for a chunk.
- [X] Wire `S2C_REGION_LOAD` and `S2C_REGION_UNLOAD` into the terrain renderer.
- [X] Use the material registry from E42-S01 to resolve colors.
- [X] Add a debug toggle to show chunk boundaries and material IDs.
- [X] Write test: loading a region with one tile of `bellstone_plaza` creates an instance with that material color.
- [X] Write test: unloading a region removes all associated terrain instances.
- [X] Write test: no per-tile draw calls; all tiles of the same material share an `InstancedMesh`.

## Acceptance criteria

- [X] The client no longer renders a single flat green plane for the world floor.
- [X] Each tile in the loaded region is rendered with its `underlayId` color.
- [X] Tiles with `overlayId` render an overlay color pass.
- [X] Terrain chunks are rebuilt on region load/unload.
- [X] Render budget is met: instanced meshes, no per-tile `Mesh`.
- [X] Visual style remains lo-fi and original.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [ ] `bun run dev` — visually confirm the starter region has colored ground tiles

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E42/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E42 — Old Town Terrain and District Identity

## Dependency chain

- Depends on: E41 (Item Asset Pipeline and Equipment Visuals), E34 (Worker Chunk Baking and Scene Residency), E33 (Render Resource Registry, Instancing, and Pools), E17 (Map Environment Schema Gaps)
- Unlocks: E43 (Buildings, Collision, and World Topology), E44 (Service NPCs and Economy Wiring), E45 (Core Gameplay Loop)

## Spec references

- `POC_SPEC.md` §4 (Spatial model)
- `POC_SPEC.md` §5.1 (Tile data — `underlayId`, `overlayId`, `height`, `water`, `bridge`)
- `POC_SPEC.md` §7.2 (Three.js world layers — TerrainLayer, StaticObjectLayer)
- `POC_SPEC.md` §23.2 (Art constraints — low-poly, readable, instanced)
- `docs/world/districts-and-routes.md` — district list and shorthand
- `docs/map/district-boundaries.md` — district trigger boxes
- `scripts/generate-old-town-map.ts` — current starter-region generator
- `content/maps/old-town-0-0-0.json` — authored runtime region

## Epic goal

The current client renders a flat green plane with no ground identity. The authored 96×96 starter region already defines twelve distinct districts with unique ground materials (`bellstone_plaza`, `soot_cobble`, `chalk_flagstone`, etc.), but the renderer ignores them. This epic makes Old Town look like a real town by rendering the authored tile data: district ground materials, water edges, bridges, and gentle elevation. The player should be able to stand in the Market Bell and immediately see the difference between the bellstone plaza, the soot-black foundry cobbles, and the chalk-white Lath Yard.

The goal is not photorealism. It is readability: every district should have a clear visual identity at a glance, consistent with the lo-fi Three.js style and the original-only asset rule.

## Approach summary

1. **Ground material registry.** Define a content registry for ground materials (`underlayId`/`overlayId`) that maps each material ID to a material definition: base color, accent color, noise parameters, roughness, and whether it is water/bridge. All original; no OSRS textures.
2. **Chunk-based terrain renderer.** Replace the flat green debug plane with a `TerrainRenderer` that reads the loaded region tile data and builds instanced or merged tile meshes per chunk. Each tile gets its correct material based on `underlayId`/`overlayId`.
3. **District transitions.** Use the district trigger boxes from `content/maps/` to paint the terrain in the world editor / generator. The renderer does not need to know district names; it only needs the tile material IDs.
4. **Water and bridges.** Render water as a translucent plane below ground level where `water: true`. Bridges render above water with `bridge: true` and suppress water collision on bridge tiles.
5. **Elevation foundation.** Use `height` as integer elevation units (e.g., 1 unit = 0.5 world units). Render tiles with stepped elevation. Keep the POC elevation simple; avoid smooth terrain for now.
6. **Validation.** Add content validation that every material ID referenced by a map exists in the material registry. Add a visual smoke test that renders the starter region and asserts at least one tile uses each district material.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E42/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E42-S01` — [Ground material registry and tile material mapping](stories/E42/E42-S01_ground-material-registry-and-tile-material-mapping.md)
- [X] `E42-S02` — [Render terrain chunks from region underlay and overlay data](stories/E42/E42-S02_render-terrain-chunks-from-region-underlay-and-overlay-data.md)
- [X] `E42-S03` — [District material painting and transitions](stories/E42/E42-S03_district-material-painting-and-transitions.md)
- [X] `E42-S04` — [Water, bridges, and elevation rendering](stories/E42/E42-S04_water-bridges-and-elevation-rendering.md)
- [X] `E42-S05` — [Terrain validation and starter-region visual pass](stories/E42/E42-S05_terrain-validation-and-starter-region-visual-pass.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The client renders the Old Town starter region with district-specific ground materials instead of a flat green plane.
- [X] Every `underlayId`/`overlayId` referenced in `content/maps/*.json` resolves to a material in the registry.
- [X] Water, bridges, and elevation are rendered in a simple, readable lo-fi style.
- [X] The renderer remains within the performance budget: instanced/merged terrain, no per-tile draw calls.
- [X] The implementation preserves server authority, integer tile truth, and content-driven definitions.
- [X] No OSRS/Jagex textures, colors, or map layouts are used.

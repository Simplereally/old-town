# E54 — Terrain, Water, and Natural Features

## Dependency chain

- Depends on: none hard (parallel to E53)
- Unlocks: E55 (District Layout Overhaul)

## Spec references

- **Load the `old-town-asset-craft` skill (`.claude/skills/old-town-asset-craft/SKILL.md`) before starting any story in this epic** — binding doctrine for palettes, textures, and generators.
- **`docs/world/terrain-material-palette.md` — THE design authority for ground materials** (retunes + additions, exact hexes, zoning rules).
- `packages/shared/src/content-schemas/region-map.ts` — tile schema **already supports** `height`, `water`, `bridge`, `underlayId`, `overlayId`, `collision` on tiles and overrides (lines ~30–49). No schema work needed for basic features.
- `apps/client/src/game/scene/TerrainLayer.ts` — already renders water tiles (`waterGeometry`/`waterMaterial`, ~line 48–58), bridge walkways (~line 50, `tile.bridge` ~line 108), and cliff faces from neighbor height deltas (~line 93–130).
- `scripts/generate-old-town-map.ts` — **the maps are generated**, not hand-authored: design-space placements → four 64×64 region JSONs. All terrain/layout edits go through this generator; never hand-edit `content/maps/*.json`.
- `content/materials/starter-materials.json` — 45 existing materials (many the plan wanted to "add" already exist).

## Epic goal

Break the flat, single-colour world: retuned+expanded material palette, baked ground textures in
the terrain renderer, and the big natural features — river with banks and a bridge, elevation
(terraces, plateau, grave mound), cliffs, groves-ready ground zoning — emitted by the map
generator with correct collision.

## Corrections to the original plan (do not re-introduce)

- **No hand-rewriting of map JSON.** The generator (`generate-old-town-map.ts`) is the single
  authoring surface; its design space claims 96×96 (header comment) while the world is 4×64×64.
  The first terrain story resolves that discrepancy by reading the coordinate mapping and, if
  needed, extending the design space to cover all 128×128 — that's a generator change, not a
  data workaround.
- Only ~10 materials are genuinely new; 12 existing ones get retuned per the palette doc.
- Water, bridge, and cliff rendering already exist client-side — the work is *emitting* the
  tiles and collision, plus textures, not building renderers.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E54/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E54-S01` — [Material palette retune and additions](../stories/E54/E54-S01_material-palette-retune-and-additions.md)
- [ ] `E54-S02` — [Baked terrain textures in TerrainLayer](../stories/E54/E54-S02_baked-terrain-textures-in-terrainlayer.md)
- [ ] `E54-S03` — [Map generator: terrain feature authoring support](../stories/E54/E54-S03_map-generator-terrain-feature-authoring-support.md)
- [ ] `E54-S04` — [River, bridge, and elevation carving](../stories/E54/E54-S04_river-bridge-and-elevation-carving.md)

## Epic acceptance criteria

- [ ] Ground reads as textured zones, not flat fills; districts are colour-zoned per the palette doc.
- [ ] The river crosses the world with sand/gravel banks, impassable water, and one bridge crossing that is walkable.
- [ ] Elevation: foundry terraces, chalk plateau, grave mound, riverbanks — with cliff faces rendering and cliff-edge collision correct.
- [ ] All map data still round-trips through `generate-old-town-map.ts`; `content:validate` green; region-loader tests updated and green.

# E53-S03 — BuildingGltfLoader and ObjectRenderer GLB preference

## Epic

E53 — Unique Building GLB Pipeline

## Dependency chain

- Depends on: E53-S02
- Blocks: E53-S04

## Objective

Load building GLBs at runtime and make `ObjectRenderer` prefer them over the S01 procedural
fallbacks, behind a persisted settings toggle, with per-archetype fallback on failure.

## Implementation guidance

- **`apps/client/src/game/scene/BuildingGltfLoader.ts`:** clone `WeaponGltfLoader.ts`
  structurally. `MODEL_BASE = "/models/buildings/"`; archetype list from the S02 manifest
  (import the JSON); extract the first mesh `BufferGeometry` per GLB; register via the
  registry. **Key scheme decision:** read `_ensureArchetypeRegistered` (ObjectRenderer ~line
  591) to see the exact prop geometry key it uses (`{ type: "prop", contentId: <?> }`), then
  use `replaceGeometryFactory` on a `_glb`-suffixed variant of that key — the same relationship
  weapons use between `model_<family>` and `model_<family>_glb`. Do not invent a third scheme.
- **Mode plumbing in `ObjectRenderer`:** add `_buildingModelMode: "glb" | "procedural"` and a
  loaded-set `glbBuildingArchetypes`; in `_ensureArchetypeRegistered` (or the geometry lookup
  it feeds), select the `_glb` key when mode is glb AND the archetype loaded. Add
  `setBuildingModelMode(mode)` that re-resolves geometry for already-instanced building
  objects — **read how ObjectRenderer instances props first** (`ObjectRenderer.instancing.test.ts`
  is the guide): if geometry is baked into shared InstancedMesh at build time, mode switching
  requires rebuilding those instanced meshes; find the existing rebuild/refresh path (region
  reload?) and reuse it rather than writing a bespoke one. If a cheap rebuild path doesn't
  exist, make the toggle take effect on next region load and note that in the settings UI label
  — do NOT build a complex live-rebuild system for this story.
- **Materials:** vertex-colour Lambert via `glb-materials.ts` helper (same as weapons/armour).
  Buildings have no tier tint — plain white tint.
- **Bootstrap:** call the preload from wherever `GameEngine.ts` triggers weapon preload;
  same hot-swap-on-load-complete behavior.
- **Settings:** extend `RenderSettings` with `buildingModels` (bump version with migration —
  coordinate with E52-S04's v2 bump if already landed; otherwise this story does its own bump).

## Required work

- [ ] Loader + registration + bootstrap + failure tolerance (one bad GLB → that archetype stays procedural, warn once).
- [ ] Mode selection + `setBuildingModelMode` with the pragmatic rebuild semantics above.
- [ ] Settings toggle + persistence + settings-panel control (follow the weapon toggle's UI pattern).
- [ ] Tests: manifest-driven registration; failure fallback; mode selection picks `_glb` key only when loaded; toggle persistence migration.

## Acceptance criteria

- [ ] With assets built, the world renders GLB buildings by default; deleting one GLB from public/ degrades only that archetype.
- [ ] Toggle switches source (live or on-region-load, whichever S03 chose — documented).
- [ ] Zero change to object gameplay semantics (footprint/collision are server/content concerns untouched by mode).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

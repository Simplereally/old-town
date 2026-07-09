# E54-S02 — Baked terrain textures in TerrainLayer

## Epic

E54 — Terrain, Water, and Natural Features

## Dependency chain

- Depends on: E54-S01
- Blocks: E54-S04 (visual verification quality)

## Objective

Ground tiles get subtle baked texture instead of flat colour: a small generated tileable
grain/noise atlas sampled per material **category**, multiplied over the material colour.
Fallback to flat colour if textures fail to load.

## Implementation guidance

- **Generation — no Blender needed.** The original plan proposed Blender for texture PNGs;
  that's over-tooling. Write `scripts/generate-terrain-textures.ts` (Bun + a raw PNG encoder or
  `canvas`-free pixel writing — check what deps exist; a zero-dep PNG writer of ~60 lines is
  acceptable) producing 256×256 tileable greyscale grain per category: `grass` (soft blotch),
  `stone`/`plaza` (flag grain + cracks), `road` (directional wear), `soil` (speckle), `wood`
  (planks), `water` (skip). Greyscale centered on 0.5 so multiply-blend leaves the palette
  colour authoritative. Deterministic seed per category. Pack all categories into ONE atlas
  PNG (grid) + a JSON descriptor (category → uv rect). Output `assets/terrain/textures/`,
  copy script → `apps/client/public/textures/terrain/`, npm scripts `terrain:textures`,
  `terrain:copy`, `terrain:build`.
- **TerrainLayer integration:** read how tile materials are constructed
  (`createInstancedMesh` / material creation — and the three `TerrainLayer.e42*.test.ts`
  files to learn the test seams). Load the atlas async; on load, set it as `map` on the
  terrain materials with per-instance UV offset by category (if tiles of different categories
  share one material/InstancedMesh, use the descriptor to offset UVs per instance —
  investigate the instancing layout FIRST; if per-instance UV is intrusive, an acceptable
  v1 is world-space UV mapping per category-group material: `uv = worldXZ * scale` with
  `RepeatWrapping`, choosing the atlas cell by material category at material-creation time).
  Choose the simplest mechanism the current instancing layout allows and write the choice +
  reasoning in the story completion note.
- **Fallback contract:** before atlas load (and on failure) rendering is exactly today's flat
  colour. No flash of untextured→textured is acceptable at region load if the atlas is
  preloaded alongside other boot assets — hook the same preload phase the GLB loaders use.
- Keep `vertexColors`/tint math unchanged; the texture is multiply-only detail. Amplitude
  stays subtle: the palette doc's colours must still dominate (multiply range ~0.85–1.15).

## Required work

- [ ] Generator + atlas + descriptor + copy + npm scripts (deterministic output, committed assets).
- [ ] TerrainLayer sampling with graceful fallback.
- [ ] Tests: descriptor/atlas load path, fallback on missing texture, material category → cell mapping; extend existing TerrainLayer tests rather than a new harness.
- [ ] Perf: `bun run stress:render:ci` green (texture adds no draw calls; verify).

## Acceptance criteria

- [ ] In-game ground shows visible-but-subtle grain; screenshot before/after in the story note.
- [ ] Deleting the atlas from public/ yields today's rendering with one console warning.

## Validation commands

- `bun run terrain:build`
- `bun run test && bun run typecheck && bun run lint`
- `bun run stress:render:ci`

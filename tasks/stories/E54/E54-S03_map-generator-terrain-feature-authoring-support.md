# E54-S03 — Map generator: terrain feature authoring support

## Epic

E54 — Terrain, Water, and Natural Features

## Dependency chain

- Depends on: none (parallel to S01/S02)
- Blocks: E54-S04, E55 (all layout stories)

## Objective

Make `scripts/generate-old-town-map.ts` capable of authoring the full feature set the runtime
schema already supports — height, water, bridge, overlays, region-spanning shapes — so S04 and
E55 express the world as high-level design-space declarations, not per-tile lists.

## Implementation guidance

- **Resolve the coordinate-space discrepancy first.** The generator header says "96×96
  design-space" but the world is 4 regions × 64 = 128×128. Read the mapping code; if the design
  space genuinely stops at 95, extend it to 128×128 (0–127) so all four regions are fully
  authorable. Regions: global `(gx, gy)` → region `(rx = gx >> 6, ry = gy >> 6)`, local
  `(gx & 63, gy & 63)` — match whatever convention the existing mapping uses; do not invent a
  new one. Document the verified mapping in the header comment (replace the stale one).
- **Current gap:** the generator's `tileOverrides` emit only `underlayId`/`collision`, but the
  region schema (`region-map.ts` ~lines 44–49) accepts `height`, `overlayId`, `water`,
  `bridge`. Extend the generator's override type and emitters to cover all of them.
- **Authoring primitives** (design-space, global coords; each compiles to per-region tile
  overrides):
  - `rect(x0,y0,x1,y1, patch)` and `path(points[], width, patch)` — patch = partial tile
    override (underlay/height/collision/water/bridge/overlay).
  - `heightRamp(from, to, h0, h1)` — linear interpolation along an axis for terraces/banks.
  - `riverSegment(centerline points[], width, depthProfile)` — emits `water: true` channel
    tiles + bank underlays (`riverbed_sand` inner bank, `river_gravel` outer) 1 tile each side.
  - `bridge(x, y, orientation, length)` — `bridge: true` + `timber_deck` underlay + walkable
    collision over water.
  - Auto-collision rule: water tiles get full block mask **unless** `bridge`; cliff-edge
    blocking where |Δheight| ≥ 2 between neighbors gets the directional block bit on the high
    side (read `packages/shared/src/collision-flags.ts` for the directional bitmask semantics
    — 🔒 tile bitmask collision invariant; use exactly those bits).
- **Determinism:** generator output must be byte-stable (sorted emission). Add a test that runs
  the generator twice into temp dirs and diffs.
- **Regression safety:** running the extended generator with the CURRENT design data must
  produce maps that keep `bun run test` green (region-loader counts unchanged at this story —
  content changes come in S04/E55). If the current maps were hand-drifted after their last
  generation, reconcile: regenerate, diff against `content/maps/*.json`, and fold any manual
  drift back into design data first. This reconciliation is part of this story — do not skip it.

## Required work

- [ ] Coordinate space extended + documented; drift reconciliation done.
- [ ] Full tile-override emission (height/water/bridge/overlay) + authoring primitives + auto-collision rules.
- [ ] Unit tests for the primitives (pure functions over the design space: rect clipping at region borders, ramp math, river bank emission, bridge collision override, cliff-edge bits).
- [ ] Determinism test.

## Acceptance criteria

- [ ] A single design-space declaration spanning two regions compiles to correct overrides in both region files (test-proven at the 63/64 boundary).
- [ ] Water/bridge/cliff collision follows the invariant bitmask scheme.
- [ ] Regenerating with unchanged design data is a no-op diff.

## Validation commands

- `bun scripts/generate-old-town-map.ts && git diff --stat content/maps` (no-op at this story)
- `bun run test && bun run typecheck && bun run lint && bun run content:validate`

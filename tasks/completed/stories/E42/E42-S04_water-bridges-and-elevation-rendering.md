# E42-S04 — Water, bridges, and elevation rendering

## Epic

E42 — Old Town Terrain and District Identity

## Dependency chain

- Depends on: E42-S02 (Render Terrain Chunks), E17-S01 (Resource Node Placement to Region Map)
- Blocks: E42-S05

## Spec references

- `POC_SPEC.md` §5.1 (Tile data — `height`, `water`, `bridge`)
- `POC_SPEC.md` §11.1 (Movement model — walk/run)
- `POC_SPEC.md` §23.2 (Art constraints — low-poly)
- `docs/map/collision-and-route-rules.md` — water and bridge collision rules

## Objective

Add visual support for water, bridges, and elevation. The starter region has a river near River Stoop and the bridge in the OSRS-style map reference. Even if the first POC map is mostly flat, the renderer must support stepped elevation and translucent water so future world expansion can use vertical terrain.

## Required architectural decisions

- **Elevation units:** `height` is an integer tile attribute. 1 height unit = 0.5 world units. Tiles are rendered as stepped blocks rather than smooth terrain to keep the lo-fi OSRS feel.
- **Water rendering:** Water tiles render as a translucent blue plane at a fixed lower level (e.g., -0.25 world units). They are flagged `water: true` in the tile data. The collision system blocks movement into water unless a bridge is present.
- **Bridge rendering:** Bridge tiles render a raised walkway above water. They are flagged `bridge: true`. The bridge suppresses water collision on the same tile, allowing movement.
- **Cliffs:** Adjacent tiles with different `height` values render as vertical cliff faces. Use a simple darkened side material for the cliff face.
- **No swimming:** For POC, water is a blocker; bridges are the only crossing. Swimming can be added later as a skill unlock.

## Implementation checklist

- [X] Extend `ChunkGeometry` to render tile height as vertical step blocks.
- [X] Add water plane rendering for tiles with `water: true`.
- [X] Add bridge rendering for tiles with `bridge: true`.
- [X] Add cliff-face rendering for height differences between adjacent tiles.
- [X] Extend the collision system to use `water` and `bridge` flags.
- [X] Write test: a water tile without a bridge blocks movement.
- [X] Write test: a bridge tile over water allows movement.
- [X] Write test: height difference blocks movement unless both tiles have a bridge or a ramp.

## Acceptance criteria

- [X] Water tiles render as translucent planes below ground level.
- [X] Bridges render as raised walkways and allow movement over water.
- [X] Elevation differences create stepped tiles and cliff faces.
- [X] Collision respects water and bridge flags.
- [X] The starter map demonstrates at least one bridge and one water edge.
- [X] Visual style remains lo-fi and readable.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [ ] `bun run dev` — visually confirm water, bridge, and elevation

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E42/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

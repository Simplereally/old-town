# E54-S04 — River, bridge, and elevation carving

## Epic

E54 — Terrain, Water, and Natural Features

## Dependency chain

- Depends on: E54-S01, E54-S02, E54-S03
- Blocks: E55 layout stories

## Objective

Use the S03 primitives to carve the starter world's landforms: the river with banks and one
bridge, and the elevation program (terraces, plateau, mound, banks). Districts get their ground
zoning in E55; this story is landforms only.

## Design (authoritative for this story)

Coordinates are design-space global tiles (post-S03, 0–127 if extended; scale proportionally if
the resolved space differs — keep the topology). District positions per
`docs/world/districts-and-routes.md`; the layout below is chosen so no landform collides with a
planned district footprint (cross-check that doc before carving; adjust ±4 tiles as needed and
record final coordinates in the story note).

- **River:** enters the east edge at ~(127, 78), curves southwest through River Stoop
  (~(96, 72) → (80, 84)), exits the south edge at ~(70, 127). Width 3 tiles of `water`, plus
  1-tile `riverbed_sand` inner bank and 1-tile `river_gravel` outer bank each side. Height:
  water tiles at height 0; banks ramp 0→1 outward.
- **Bridge:** at the river's narrowest point on the Market→River Stoop desire line
  (~(88, 78)), orientation across the flow, length = water width + 2 (one tile landing each
  end), `timber_deck`, walkable; the ONLY crossing.
- **Foundry terraces:** two `heightRamp` steps rising north across Foundry Row's approach
  (heights 0→1→2, each terrace ≥ 6 tiles deep so the street reads as stepped, with ramp tiles
  at the Oldroad junction kept at walkable slope — no cliff bit on the ramp line itself).
- **Chalk plateau:** Chalkhouse Court raised to height 2 with `chalk_scree` skirt ramps on the
  south approach; other edges get cliff faces + edge collision.
- **Grave mound:** Gravegate rises 0→1→2 in concentric rings toward the crypt site; crypt
  placement (E55) sits at the peak per the building spec's "sits lower than grade" note —
  the mound provides the grade.
- **Riverbanks elsewhere:** any non-district river frontage gets `wild_grass` at height 1
  above water.

## Required work

- [ ] Express the above as S03 primitive declarations in the generator's design data; regenerate maps.
- [ ] Update `apps/server/src/world/region-loader.test.ts` expected counts (read the actual current expectations — the plan's remembered numbers may be stale — and update to the regenerated reality; assert water/bridge tile counts too if the loader exposes them).
- [ ] Walkability test (server-side, pathing over loaded regions — reuse whatever pathing test harness exists): (a) no path exists across the river except via the bridge; (b) the bridge tile sequence is walkable end-to-end; (c) plateau/terrace tops are unreachable except via their ramps.
- [ ] Visual pass: `bun run world-editor:dev` + `bun run dev` — cliff faces render along every height edge, water animates, banks zone correctly, bridge walkable in-game. Screenshots in the story note.

## Acceptance criteria

- [ ] River, bridge, terraces, plateau, and mound exist in regenerated maps with correct materials, heights, and collision.
- [ ] Walkability tests green; region-loader tests updated and green.
- [ ] Player spawn and all existing NPC/node placements remain on walkable tiles (add a generator assertion: every spawn/placement tile must be non-blocked after terrain application — fail generation otherwise).

## Validation commands

- `bun scripts/generate-old-town-map.ts && bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`

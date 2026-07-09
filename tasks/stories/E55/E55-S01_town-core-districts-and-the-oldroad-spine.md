# E55-S01 — Town core districts and the Oldroad spine

## Epic

E55 — District Layout and Placement Overhaul

## Dependency chain

- Depends on: E53-S01, E54-S03, E54-S04
- Blocks: E55-S02

## Objective

Lay out the eight core-town districts (Market Bell, Counting House, Foundry Row, Lath Yard,
Patch Lane, Shrine Hearth, Sootcellar, Oldroad Gate) and the Oldroad street in the map
generator's design data.

## Method (applies to all E55 stories)

1. Read `docs/world/districts-and-routes.md` and reconcile the epic's district table against
   it — the doc wins on positions; the epic wins on building lists (it knows the E53 set).
2. Author everything as design-space declarations in `generate-old-town-map.ts` data:
   buildings (object placements with rotation), stations, NPC spawns (with `wanderRadius` —
   0 for posted vendors, small for wanderers), resource nodes, ground zoning (`rect`/`path`
   patches from E54-S03).
3. Before/after each district: regenerate, open `bun run world-editor:dev`, verify visually
   and with the collision probe. Iterate in the generator, never in the JSON.
4. **Preserve or consciously migrate every existing placement.** Diff regenerated maps against
   the previous state; every removed NPC/node/object must be re-placed in its district or its
   removal justified in the story note (cross-check E45's assumptions: starter nodes
   `dry_tree_node`, `scrub_tree`, `copper_rock_node`, `tin_rock_node`, `river_perch_spot`;
   `cellar_rat` cluster; spawn 45,45; if any must move, update the affected E45/E46 story
   files' referenced coordinates in the same commit).

## District specifics

- **Oldroad spine:** `path` of `oldroad_slabs`, width 3, Gate → Market square → Foundry Row,
  with `grass_to_oldroad_slabs` transition edging (1 tile each side) and the E54 terrace ramps
  respected at the Foundry end.
- **Market Bell:** `bellstone_plaza` rect ~12×12 centered on the bell tower; tower on the north
  side (not dead center — the plaza is the center, per hub-and-spoke); 3 `market_stall` at
  varied rotations, `well` off-center, `kitchen_hearth` on the plaza's east edge (Pippa
  Hearth's cooking station adjacent). Spawn point stays on plaza grass-free tiles.
- **Counting House:** west of the plaza; door faces the plaza; Tomas Tally inside behind the
  booth (bank station object placement per current bank system — find how the existing bank
  booth object/station is placed today and keep its object ids).
- **Foundry Row:** on the E54 terraces; forge open front faces the street; `anvil_shed` beside
  it; furnace + anvil station objects inside/adjacent; copper/tin rock nodes on the upper
  terrace with `quarry_grit` + `foundry_slag` ground.
- **Lath Yard:** south of the plaza; workshop + bow bench; grove of 8–12 mixed
  `dry_tree`/`scrub_tree`/`oak_tree` on `orchard_grass` — spaced ≥2 tiles apart so pathing
  between trees works.
- **Patch Lane:** tannery + 2 garden plots + tanning frame; `patch_grass`/`garden_loam` zoning.
- **Shrine Hearth:** shrine_hall on `cobble_mossy` apron; Sister Writ posted at the door.
- **Sootcellar:** `cellar_ruin` over the existing cellar area; keep the `cellar_rat` spawns
  inside/around the ruin walls; `soot_cobble` ground; Marn Lock at the hatch.
- **Oldroad Gate:** gatehouse straddling the Oldroad at the west/north edge (match the doc's
  exit direction); Finch Quill + map table + signpost inside the gate; small grove outside.

## Required work

- [ ] All eight districts + spine authored in the generator; maps regenerated.
- [ ] Placement-preservation diff done; E45/E46 coordinate references updated where placements moved.
- [ ] `region-loader.test.ts` counts updated.
- [ ] Generator assertion suite extended: every NPC/station/node tile walkable and within its district rect; every building footprint collision-consistent with its def.

## Acceptance criteria

- [ ] From spawn, a player can walk: plaza → bank → forge → grove → tannery → shrine → cellar → gate without collision surprises (verify in `bun run dev`; note the route).
- [ ] All eight districts' NPCs posted; stations adjacent to their buildings.
- [ ] Oldroad reads as a continuous paved street with transitions.

## Validation commands

- `bun scripts/generate-old-town-map.ts && bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`

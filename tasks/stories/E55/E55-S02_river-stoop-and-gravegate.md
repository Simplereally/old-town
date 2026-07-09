# E55-S02 — River Stoop and Gravegate

## Epic

E55 — District Layout and Placement Overhaul

## Dependency chain

- Depends on: E55-S01
- Blocks: E55-S03

## Objective

Lay out the two danger-adjacent districts along the E54 river and mound: River Stoop (fishing,
cooking, first water hazard) and Gravegate (graveyard, crypt, mid-tier mobs).

Follow the Method section of E55-S01 (doc reconciliation, generator-only authoring,
placement-preservation diff, world-editor verification) — it applies verbatim.

## District specifics

- **River Stoop** (at the E54 bridge landing):
  - `river_fishmonger` on stilts at the bank edge (legs over `riverbed_sand`), `dock`
    extending over water tiles beside it.
  - Edda Tinfin posted at the stall; Bramble Hook near the dock (verify each NPC's owned
    system per `docs/world/npc-cast.md` and place them adjacent to that system's station).
  - `river_perch_spot` fishing node(s) on bank tiles reachable from the dock/bank (2 spots,
    ≥4 tiles apart). Keep/move the existing spot per the preservation diff.
  - `river_snapper` mob spawns (2–3) on the far bank / shallows edge so crossing the bridge
    reads as entering their space — but NOT blocking the bridge landing tile itself
    (first-crossing must be survivable; snappers aggressive radius must not cover the bridge
    walkway — check the npc def's `aggressiveRadius` and place accordingly, or place them
    peaceful-side distances away).
  - Ground: `river_mud` working area, `timber_deck` under stall/dock aprons.
- **Gravegate** (on the E54 mound):
  - `graveyard_crypt` at the mound peak; gravegate arch (existing `gravegate_arch` landmark —
    keep it) as the entrance at the mound base; `graveyard_path` from arch to crypt.
  - 8–12 `grave_mound` objects (new def in E55-S04's content-fills if not yet present —
    author the def in THIS story if S04 hasn't run; keep defs and placements in the same
    story when ordering makes it necessary, and say so in the note) scattered in rings on
    `grave_soil`, ≥2 tiles apart.
  - Gravekeeper Soll posted inside the arch. `grave_mite` (3–4) among the mounds; `grave_wisp`
    (2) near the crypt — the danger gradient rises toward the peak.
  - Existing `mud_goblin` spawns (E45-S04 depends on them at North Quarry Road): preserve
    their region/coordinates or update E45-S04's coordinate references in the same commit.

## Required work

- [ ] Both districts authored; maps regenerated; preservation diff + E45 reference updates.
- [ ] `region-loader.test.ts` counts updated.
- [ ] Walkability additions to the E54 test: dock and stall aprons walkable; snapper spawns don't blockade the bridge path (pathfind spawn→crypt succeeds).
- [ ] Mob-safety assertion in the generator: no aggressive mob's aggression radius covers the bridge walkway or a fishing spot tile.

## Acceptance criteria

- [ ] A new player can walk from Market to the fishing spot and fish without being attacked; stepping past the far bank picks a fight — the danger boundary is legible.
- [ ] Gravegate reads as a place: arch → path → mounds → crypt, mobs thickening uphill.
- [ ] All placements survive `content:validate` cross-referencing.

## Validation commands

- `bun scripts/generate-old-town-map.ts && bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`

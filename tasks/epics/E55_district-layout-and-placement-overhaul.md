# E55 — District Layout and Placement Overhaul

## Dependency chain

- Depends on: E53-S01 (building defs exist; GLBs optional — procedural fallbacks render), E54 (terrain primitives + landforms)
- Unlocks: the starter world actually looking like a town

## Spec references

- `docs/world/districts-and-routes.md` — 12 districts + station placements (canonical district map)
- `docs/world/starter-town.md` — first-session goals, acceptance rules (**no decorative-only NPCs**)
- `docs/world/npc-cast.md` — 14 named starter NPCs and the system each owns
- `docs/world/starter-buildings-visual-spec.md` — building footprints being placed
- `scripts/generate-old-town-map.ts` — the ONLY authoring surface (post E54-S03 primitives)
- E45 assumption to preserve: player spawn at Market Bell (`market_bell` landmark currently at design (48,48); dev spawn tile 45,45 per E45 epic — keep both true or update E45's stories if you must move them, with a note)

## Epic goal

Rewrite the starter world's placements region-by-region into the hub-and-spoke district plan:
unique buildings at district anchors, stations inside or beside their buildings, all 14 named
NPCs at their posts, mobs in logical danger zones, resources clustered where they belong
(groves, quarry, fishing, graves), Oldroad as the paved spine, and a collision-clean, fully
walkable 128×128 continuous town.

## District plan (working copy — reconcile against `districts-and-routes.md`, which wins)

| District | Anchor buildings | NPCs | Notes |
|---|---|---|---|
| Market Bell (center) | `market_bell_tower`, 3–4× `market_stall`, `well`, `kitchen_hearth` | Mara Bellkeeper, Pippa Hearth | spawn, `bellstone_plaza` |
| Counting House | `counting_house` | Tomas Tally | bank booth inside |
| Foundry Row | `foundry_forge`, `anvil_shed` | Osric Penny | furnace+anvil stations, copper/tin nodes on terraces |
| Lath Yard | `bowyer_workshop` | Letha Lath | bow bench, `orchard_grass` grove of trees |
| Patch Lane | `tannery`, 2× `garden_plot` | Nell Patch | tanning frame station |
| Shrine Hearth | `shrine_hall` | Sister Writ | shrine_hearth station, `cobble_mossy` |
| Sootcellar | `cellar_ruin` | Marn Lock | cellar rats, cellar_king, `soot_cobble` |
| Oldroad Gate | `gatehouse`, signpost, map table | Finch Quill | north exit, grove outside gate |
| Chalkhouse Court | `chalkhouse`, `bead_loom_hall` | Mother Tallow | chalk plateau (E54) |
| River Stoop | `river_fishmonger`, `dock` | Edda Tinfin, Bramble Hook | fishing spot, river_snapper, bridge landing |
| Gravegate | `graveyard_crypt`, grave mounds | Gravekeeper Soll | grave_mite/grave_wisp, mound peak |
| Warden Steps | `warden_post` | Warden Holt | warden board, guard patrol |
| Residential fill | 6–9× `generic_house_a/b/c` | — | between districts, varied rotations; houses are set dressing, not enterable |

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E55/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E55-S01` — [Town core districts and the Oldroad spine](../stories/E55/E55-S01_town-core-districts-and-the-oldroad-spine.md)
- [ ] `E55-S02` — [River Stoop and Gravegate](../stories/E55/E55-S02_river-stoop-and-gravegate.md)
- [ ] `E55-S03` — [Chalkhouse Court, Warden Steps, and residential fill](../stories/E55/E55-S03_chalkhouse-court-warden-steps-and-residential-fill.md)
- [ ] `E55-S04` — [Collision pass, content fills, and full-town acceptance](../stories/E55/E55-S04_collision-pass-content-fills-and-full-town-acceptance.md)

## Epic acceptance criteria

- [ ] Every district from `districts-and-routes.md` exists with its anchor building(s), stations, and NPCs; all 14 named NPCs placed.
- [ ] Mobs and resources are district-logical (rats in cellar, mites in graveyard, snappers at river, ores at quarry terraces, trees in groves).
- [ ] Oldroad runs Gate → Market → Foundry as a continuous `oldroad_slabs` street with transitions.
- [ ] Every district reachable on foot from spawn; collision blocks walls/water/cliffs; bridge and gatehouse arch walkable.
- [ ] All E45 gameplay-loop stories still pass (spawn point, starter nodes, rat/goblin combat placements preserved or relocated with E45 docs updated).
- [ ] `bun run content:validate && bun run test && bun run typecheck && bun run lint` green.

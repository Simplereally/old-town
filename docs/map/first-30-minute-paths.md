---
doc_type: authority
canonical_path: docs/map/first-30-minute-paths.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/world/starter-economy-loops.md`
- `docs/map/collision-and-route-rules.md`
- `docs/map/npc-placement.md`
- `docs/map/station-placement.md`
- `docs/quests/starter-quest-arc.md`

# First 30 Minute Paths

These 6 starter loops define what a new player can do immediately. Each loop has an exact district sequence, a set of skills taught, and an approximate tile distance. All distances are one-way from Market Bell to the loop's farthest point and back.

## Loop Table

| Loop | Name | Route (Districts) | Skills Taught | Approx. Tile Distance |
|------|------|-------------------|---------------|----------------------|
| A | Spawn to Bank to Rats | Market Bell, Counting House, Sootcellar, Market Bell | Movement, banking, first combat, return | 40 |
| B | Full Penny | Market Bell, Foundry Row, North Quarry Road, Foundry Row, Market Bell | Mining, Smithing, smelting, forging | 80 |
| C | Full Lath | Market Bell, Lath Yard, Oldroad Gate, Lath Yard, Market Bell | Woodcutting, Bowcraft, arrow making | 70 |
| D | Full Patch | Market Bell, Patch Lane, Market Bell | Trapping, Tailoring, tanning, stitching | 30 |
| E | Full Chalk | Market Bell, Chalkhouse Court, River Stoop, Chalkhouse Court, Market Bell | Beadwork, Magic, clay gathering, firing | 60 |
| F | First Mystery | Market Bell, Oldroad Gate, Sootcellar, Warden Steps, Market Bell | Sleight, Cartography, investigation, route logic | 90 |

## Loop A: Spawn to Bank to Rats

1. Spawn at Market Bell (48, 48).
2. Walk west to Counting House (36, 48). Talk to Tomas Tally. Open bank.
3. Walk south to Sootcellar entrance (40, 40).
4. Enter Sootcellar. Kill 2-3 Cellar Rats near (32, 32).
5. Return north to Market Bell.

**Skills taught:** Movement, camera control, banking, first combat, death respawn preview.

## Loop B: Full Penny

1. Spawn at Market Bell (48, 48).
2. Walk east to Foundry Row (60, 48). Talk to Osric Penny.
3. Walk north to North Quarry Road (48, 76).
4. Mine 4 Penny Copper and 4 Tinstone.
5. Return south to Foundry Row.
6. Smelt Pennywrought Ingot at Bellows Furnace (66, 48).
7. Forge starter item at Anvil (62, 48).
8. Return west to Market Bell.

**Skills taught:** Mining, Smithing, smelting, forging, ore identification, tool use.

## Loop C: Full Lath

1. Spawn at Market Bell (48, 48).
2. Walk north to Lath Yard (48, 60). Talk to Letha Lath.
3. Walk west to Oldroad Gate (16, 48).
4. Cut 4 Oldroad Oak or 5 Scrub Tree.
5. Return east to Lath Yard.
6. Whittle shafts and staves at Bow Bench (48, 62).
7. String Lathwood Shortbow.
8. Return south to Market Bell.

**Skills taught:** Woodcutting, Bowcraft, arrow making, tool degradation, ranged equip.

## Loop D: Full Patch

1. Spawn at Market Bell (48, 48).
2. Walk south to Patch Lane (48, 32). Talk to Nell Patch.
3. Trap rabbits at Rabbit Snare Points (44, 36), (48, 36), (52, 36).
4. Cure hides at Tanning Frame (48, 30).
5. Stitch Patchhide Coif, Jerkin, or Chaps.
6. Return north to Market Bell.

**Skills taught:** Trapping, Tailoring, tanning, hide curing, armour equip.

## Loop E: Full Chalk

1. Spawn at Market Bell (48, 48).
2. Walk northwest to Chalkhouse Court (32, 64). Talk to Mother Tallow.
3. Walk southeast to River Stoop (64, 32).
4. Gather Listening Clay at riverbed (64, 26).
5. Return northwest to Chalkhouse Court.
6. Shape and drill bead. Fire at Bead Kiln (32, 66).
7. String bead at Bead Loom (36, 66).
8. Return southeast to Market Bell.

**Skills taught:** Beadwork, Magic, clay gathering, firing, bead stringing, wand equip.

## Loop F: First Mystery

1. Spawn at Market Bell (48, 48).
2. Talk to Mara Bellkeeper. Receive Missing Bell-Clapper quest.
3. Walk west to Oldroad Gate (16, 48). Talk to Finch Quill. Receive Chalked Map.
4. Walk southeast to Sootcellar (32, 32). Talk to Marn Lock. Receive false-bottom hint.
5. Walk northeast to Warden Steps (64, 64). Talk to Warden Holt. Receive paperwork suspicion.
6. Return to Market Bell. Follow clue chain across town.

**Skills taught:** Sleight, Cartography, investigation, NPC cross-town routing, civic mystery, quest log use.

## Loop Distance Summary

| Loop | One-way Distance | Round-trip Distance | Time Estimate (walking) |
|------|------------------|---------------------|------------------------|
| A | 20 | 40 | 2 minutes |
| B | 40 | 80 | 4 minutes |
| C | 35 | 70 | 3.5 minutes |
| D | 15 | 30 | 1.5 minutes |
| E | 30 | 60 | 3 minutes |
| F | 45 | 90 | 4.5 minutes |

All distances are tile counts, not Euclidean distance. Time assumes walking at base speed with no running.

---

*Last updated: 2026-05-31*

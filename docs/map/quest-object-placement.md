---
doc_type: authority
canonical_path: docs/map/quest-object-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/quests/starter-quest-arc.md`
- `docs/quests/smoke-over-old-town.md`
- `docs/quests/rats-under-tallys.md`
- `docs/quests/a-penny-for-the-forge.md`
- `docs/quests/string-enough-to-sing.md`
- `docs/quests/the-beadwifes-errand.md`
- `docs/quests/gravegate-flowers.md`
- `docs/quests/the-missing-bell-clapper.md`

# Quest Object Placement

Quest objects are interactable world objects tied to specific quests. They must be reachable without crossing a danger zone unless the quest explicitly teaches danger. They must not block roads, stations, or shop entrances.

## Quest Object Table

| Quest | Object | Tile | District |
|-------|--------|------|----------|
| Smoke Over Old Town | Old Kiln | (68, 44) | Foundry Row |
| Smoke Over Old Town | Smoke Vent | (66, 46) | Foundry Row |
| Rats Under Tally's | Rat-chewed Ledger | (30, 30) | Sootcellar |
| A Penny for the Forge | Broken Anvil Plate | (62, 46) | Foundry Row |
| String Enough to Sing | Split Bow Stave | (48, 58) | Lath Yard |
| The Beadwife's Errand | Listening Clay | (64, 26) | River Stoop |
| Gravegate Flowers | Wrongly Planted Flower | (64, 14) | Gravegate |
| The Missing Bell-Clapper | Bell Clapper Hook | (48, 52) | Market Bell |
| The Missing Bell-Clapper | Sooted Receipt | (34, 34) | Sootcellar |

## Placement Rules

1. **Quest objects must be within 8 tiles of a main road.** A lost object is bad design.
2. **Quest objects must not overlap with creature spawn zones unless the quest teaches combat.** The Rat-chewed Ledger is in Sootcellar because Rats Under Tally's teaches first combat.
3. **Quest objects must have 1 adjacent walkable tile.** No object may be surrounded by collision.
4. **Quest objects should cluster with their quest's skill loop.** The Broken Anvil Plate is near the Anvil. The Split Bow Stave is near the Bow Bench.
5. **Multi-object quests should space objects across districts.** The Missing Bell-Clapper sends the player from Market Bell to Sootcellar to teach cross-town routing.

## Quest Object Visibility

| Object | Visible From | Reads As |
|--------|--------------|----------|
| Old Kiln | 4 tiles | Cracked brick kiln with smoke stain |
| Smoke Vent | 3 tiles | Iron grate in the ground |
| Rat-chewed Ledger | 2 tiles | Torn book with tooth marks |
| Broken Anvil Plate | 2 tiles | Shattered metal shard on a stump |
| Split Bow Stave | 2 tiles | Cracked wood with string grooves |
| Listening Clay | 2 tiles | Grey mud pile at river edge |
| Wrongly Planted Flower | 2 tiles | White flower growing from a skull mound |
| Bell Clapper Hook | 3 tiles | Iron hook hanging from bell tower scaffolding |
| Sooted Receipt | 2 tiles | Charred paper pinned to a crate |

---

*Last updated: 2026-05-31*

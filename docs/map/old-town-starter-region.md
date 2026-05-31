---
doc_type: authority
canonical_path: docs/map/old-town-starter-region.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/map/map-placement-system.md`
- `docs/map/district-boundaries.md`
- `docs/world/districts-and-routes.md`
- `docs/world/starter-town.md`
- `docs/world/npc-cast.md`

# Old Town Starter Region

Region ID: `old_town_core`
Size: 96 x 96 tiles
Plane: 0
Origin: Southwest corner (0, 0)
Spawn center: Market Bell (48, 48)

## Hub-and-Spoke Layout

The Market Bell is the hub. Every starter district connects to it by a named spoke. Roads are 3-5 tiles wide where they enter the hub.

```
                        North Quarry Road
                              |
        Chalkhouse Court --- Lath Yard --- Warden Steps
              |                  |               |
    Oldroad Gate --- Shrine Hearth --- Market Bell --- Foundry Row --- River Stoop
              |                  |               |               |
        Sootcellar --- Patch Lane --- Gravegate
```

## District Map Roles

| District | Role | Spoke Name |
|----------|------|------------|
| Market Bell | Central spawn, trading, noticeboard | Hub |
| Counting House | Bank, reclaim, ledger desk | Bell to Bank |
| Foundry Row | Smithing, mining turn-ins | Bell to Foundry |
| Lath Yard | Bowcraft, woodcutting | Bell to Lath |
| Patch Lane | Tailoring, hides, tanning | Bell to Patch |
| Chalkhouse Court | Beadwork, basic magic | Bell to Chalk |
| Warden Steps | Contracts, guards, combat tasks | Bell to Warden |
| Shrine Hearth | Favour, offerings, cleanse | Bell to Shrine |
| River Stoop | Fishing, cooking, ferries | Bell to River |
| Oldroad Gate | Woodcutting, cartography | Oldroad Trail |
| Gravegate | Crypts, bone drops, danger | Warden to Grave |
| Sootcellar | Rats, Sleight, black market hints | Bell to Cellar |
| North Quarry Road | Mining nodes, goblins | Foundry to Quarry |

## Zone Safety Table

| Zone | Districts | Combat Rule |
|------|-----------|-------------|
| Safe | Market Bell, Counting House, Warden Steps | No hostile spawns. Event pests only. |
| Soft danger | Foundry Row, Lath Yard, Patch Lane, Chalkhouse Court, Shrine Hearth, River Stoop, Oldroad Gate | Stray dogs, road crows, or edge spawns. No aggressive creatures in the district core. |
| Danger | Gravegate, Sootcellar, North Quarry Road | Active hostile spawns. Gravegate is visually gated. Sootcellar is tighter and darker. |

## Visual Landmark Silhouettes

| District | Landmark | Reads From |
|----------|----------|------------|
| Market Bell | Bell tower with hanging bell | 8 tiles |
| Counting House | Domed roof with coin-weathervane | 6 tiles |
| Foundry Row | Chimney stack with smoke plume | 10 tiles |
| Lath Yard | Tall bow rack and twine spools | 5 tiles |
| Patch Lane | Tanning frame with stretched hide | 4 tiles |
| Chalkhouse Court | Kiln glow and bead loom frame | 5 tiles |
| Warden Steps | Board with nailed contracts | 4 tiles |
| Shrine Hearth | Hearth flame and candle ring | 5 tiles |
| River Stoop | Dock posts and ferry rope | 6 tiles |
| Oldroad Gate | Archway with cart tracks | 8 tiles |
| Gravegate | Iron gate with grave mounds | 6 tiles |
| Sootcellar | Soot-stained cellar steps | 3 tiles |
| North Quarry Road | Rock face with pickaxe scars | 8 tiles |

## Origin Notes

- Tile (0, 0) is the southwest corner. Nothing important lives there. It is the map edge.
- Tile (48, 48) is the Market Bell spawn. It is the center of the hub.
- Tile (96, 96) is the northeast corner. It is the map edge and an expansion boundary.
- The region is surrounded by a 4-tile buffer of untraversable cliff or wall on all sides, making the playable area effectively 88 x 88.

---

*Last updated: 2026-05-31*

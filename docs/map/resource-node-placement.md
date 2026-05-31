---
doc_type: authority
canonical_path: docs/map/resource-node-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/resources/resource-taxonomy.md`
- `docs/map/district-boundaries.md`
- `docs/map/collision-and-route-rules.md`
- `docs/skills/gathering-skills.md`

# Resource Node Placement

Resource nodes are gatherable objects scattered across districts. They must have clear approach paths and must not block roads, entrances, or station interact tiles. Nodes respawn on a timer after depletion.

## Mining Nodes

Located in Foundry Row and North Quarry Road.

| Node | Count | Tiles | District |
|------|-------|-------|----------|
| Penny Copper | 4 | (44, 76), (48, 76), (52, 76), (50, 80) | North Quarry Road |
| Tinstone | 4 | (46, 78), (50, 78), (48, 82), (52, 82) | North Quarry Road |
| Pig Iron | 2 | (60, 44), (64, 44) | Foundry Row |
| Blackcoal | 1 | (68, 48) | Foundry Row |

## Woodcutting Nodes

Located in Oldroad Gate, Lath Yard, River Stoop, and Warden Steps.

| Node | Count | Tiles | District |
|------|-------|-------|----------|
| Scrub Tree | 5 | (12, 44), (16, 44), (20, 44), (14, 48), (18, 52) | Oldroad Gate |
| Oldroad Oak | 4 | (10, 48), (14, 52), (18, 48), (22, 48) | Oldroad Gate |
| Riverwillow | 3 | (60, 28), (64, 28), (68, 28) | River Stoop |
| Warden Yew | 1 | (68, 68) | Warden Steps |

## Fishing Nodes

Located in Patch Lane and River Stoop.

| Node | Count | Tiles | District |
|------|-------|-------|----------|
| Ditch Shrimp | 3 | (44, 28), (48, 28), (52, 28) | Patch Lane |
| Tinfin Ripple | 2 | (60, 26), (68, 26) | River Stoop |
| River Curio | 1 | (64, 24) | River Stoop |

## Trapping Nodes

Located in Patch Lane, Oldroad Gate, and Gravegate.

| Node | Count | Tiles | District |
|------|-------|-------|----------|
| Rabbit Snare Point | 3 | (44, 36), (48, 36), (52, 36) | Patch Lane |
| Bog Fox Track | 2 | (12, 52), (20, 52) | Oldroad Gate |
| Bird Lure Spot | 2 | (10, 52), (22, 52) | Oldroad Gate |

## Gardening Nodes

Located in Gravegate, Shrine Hearth, and Chalkhouse Court.

| Node | Count | Tiles | District |
|------|-------|-------|----------|
| Grave Flower Patch | 2 | (60, 12), (68, 12) | Gravegate |
| Allotment Patch | 3 | (28, 44), (36, 44), (32, 52) | Shrine Hearth |
| Herb Pot Table | 2 | (28, 64), (36, 64) | Chalkhouse Court |

## Node Placement Rules

1. **Clear approach.** Every node must have at least 1 adjacent walkable tile that is not blocked by collision.
2. **No road blocking.** Nodes may not sit on main roads or entrance tiles.
3. **No station overlap.** Nodes must be at least 3 tiles away from any station object.
4. **Cluster by type.** Nodes of the same family should be within 8 tiles of each other so players can loop them efficiently.
5. **Edge pressure.** Better or rarer nodes should be closer to danger zones or further from the hub. Warden Yew is deep in Warden Steps. Blackcoal is at the far end of Foundry Row.

---

*Last updated: 2026-05-31*

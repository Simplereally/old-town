---
doc_type: authority
canonical_path: docs/map/map-placement-system.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/map/old-town-starter-region.md`
- `docs/map/district-boundaries.md`
- `docs/world/districts-and-routes.md`
- `docs/tools-and-intermediates/stations.md`
- `POC_SPEC.md`

# Map Placement System

Old Town's map is gameplay-first, not pretty-first. The tile grid drives collision, spawn logic, pathfinding, and content validation. The renderer makes it look like a town. The grid makes it play like one.

## Coordinate Philosophy

- **Gameplay truth is integer.** Tiles, planes, IDs, and bitmasks are the authority. Three.js positions are presentational only.
- **Origin at southwest corner.** Tile (0, 0) is the southwest corner of the region. X increases east. Y increases north.
- **Half-open bounding boxes.** A box with x_min 40 and x_max 56 includes tiles 40 through 55. Area equals (x_max - x_min) * (y_max - y_min).
- **Provisional tuning.** Every coordinate in this section is a design proposal. The content JSON is the runtime source of truth, validated against these bounds.

## Region Format

| Field | Rule | Example |
|-------|------|---------|
| Region ID | kebab-case, no spaces | `old_town_core` |
| Size | Width x height in tiles | 96 x 96 |
| Plane | Integer z-level | 0 for POC starter region |
| Origin | Southwest corner tile | (0, 0) |
| Spawn center | Default player spawn tile | (48, 48) |

## Plane System

| Plane | Purpose | POC Status |
|-------|---------|------------|
| 0 | Surface world, all starter districts | Active |
| -1 | Cellars, sewers, crypt lower levels | Reserved for post-POC |
| +1 | Rooftops, towers, elevated walkways | Reserved for post-POC |

The POC uses plane 0 only. Sootcellar is represented as a surface district for now, with a note that it descends to plane -1 later.

## Bounding Box Format

Every district in [`district-boundaries.md`](district-boundaries.md) uses this table shape:

| District | x_min | x_max | y_min | y_max | Area (tiles) |

Bounding boxes must not overlap. Adjacent boxes may share an edge. Gaps between boxes are roads, alleys, walls, or open ground.

## Placement Doc Hierarchy

| Doc | Scope |
|-----|-------|
| `old-town-starter-region.md` | Region overview, district roles, zone safety |
| `district-boundaries.md` | Exact numeric bounds |
| `spawn-points.md` | Where players appear |
| `npc-placement.md` | Named NPC tiles |
| `shop-and-service-placement.md` | Shop objects and entrances |
| `station-placement.md` | Skilling station objects |
| `resource-node-placement.md` | Gatherable node clusters |
| `creature-spawn-placement.md` | Monster spawn zones |
| `quest-object-placement.md` | Quest interactable objects |
| `ledger-placement.md` | Ledger physical anchors |
| `collision-and-route-rules.md` | Movement and route design |
| `first-30-minute-paths.md` | Starter loop validation |

## Relationship to Content JSON

- `content/maps/old_town_core.json` loads the region definition.
- `content/objects/*.json` references region ID and tile coordinates.
- `content/npcs/*.json` references spawn tile and wander bounds.
- `content/creatures/*.json` references spawn zones by region and bounding box.
- The content validator checks that every referenced tile falls inside a declared district bounding box.

## Design Rules for Every District

1. **Entrance.** Every district must have at least one 2+ tile wide entrance from a main road.
2. **Landmark.** Every district must have a visual silhouette that reads from 3+ tiles away.
3. **NPC.** Every district must have at least one named NPC within 3-5 tiles of a service object.
4. **Station cluster.** Every district must have its core stations grouped so a player can see them in one camera view.
5. **Loop.** Every district must connect to at least one skilling loop that starts and ends at the Market Bell.
6. **Route.** Every district must be reachable from the Market Bell without crossing a danger zone.
7. **Expansion edge.** Every district must have at least one border that opens to future content.

---

*Last updated: 2026-05-31*

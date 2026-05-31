---
doc_type: authority
canonical_path: docs/map/00-index.md
parent_index: docs/00-index.md
root_index: docs/00-index.md
---

Parent: [`Documentation Index`](../00-index.md)

Authority references:
- `docs/world/districts-and-routes.md`
- `docs/world/starter-town.md`
- `docs/ledger/district-deeds.md`
- `POC_SPEC.md`

# Map Placement Index

This section turns the conceptual town into a playable tile layout. Every coordinate here is provisional tuning. The server owns placement truth; these docs are the design authority that content JSON must match.

## Leaf Documents

| Document | Status | Summary |
|----------|--------|---------|
| [`map-placement-system.md`](map-placement-system.md) | Complete | Coordinate philosophy, region ID format, plane system, bounding box rules, and how placement docs relate to content JSON |
| [`old-town-starter-region.md`](old-town-starter-region.md) | Complete | 96 x 96 region overview, hub-and-spoke ASCII layout, district roles, safe zones, and visual landmark silhouettes |
| [`district-boundaries.md`](district-boundaries.md) | Complete | Exact x,y bounding boxes for all 13 districts with area counts |
| [`spawn-points.md`](spawn-points.md) | Complete | Player spawn at Market Bell, death respawn at Counting House, first-session rules |
| [`npc-placement.md`](npc-placement.md) | Complete | 14 starter NPCs with exact tiles and the 3-5 tile service-object rule |
| [`shop-and-service-placement.md`](shop-and-service-placement.md) | Complete | Shop objects, entrance tiles, and entrance width rules |
| [`station-placement.md`](station-placement.md) | Complete | All skilling stations with adjacent interactable tiles |
| [`resource-node-placement.md`](resource-node-placement.md) | Complete | Mining, woodcutting, fishing, trapping, and gardening node counts and areas |
| [`creature-spawn-placement.md`](creature-spawn-placement.md) | Complete | Spawn zones, frequencies, and the starter combat placement rule |
| [`quest-object-placement.md`](quest-object-placement.md) | Complete | Quest objects with exact tiles and district anchors |
| [`ledger-placement.md`](ledger-placement.md) | Complete | Ledger physical anchors, stamp boards, and First Nook locations |
| [`collision-and-route-rules.md`](collision-and-route-rules.md) | Complete | Road widths, collision rules, and 6 starter loop routes |
| [`first-30-minute-paths.md`](first-30-minute-paths.md) | Complete | 6 starter loops with exact district sequences, skills taught, and approximate tile distances |

## Design Rule Summary

1. Every district needs an entrance, a landmark, an NPC, a station cluster, a loop, a route, and an expansion edge.
2. Main roads are 3-5 tiles wide. Shop doors are 2+ tiles.
3. Stations need 2+ adjacent interactable tiles.
4. Resource nodes need clear approach.
5. Monster spawns must not overlap safe tiles.
6. No essential NPC sits in a chokepoint.
7. Starter combat must not block starter skilling. It should pressure better nodes, shortcuts, quest spaces, and deeper routes.

---

*Last updated: 2026-05-31*

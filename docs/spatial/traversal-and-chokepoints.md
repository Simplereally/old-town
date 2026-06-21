---
doc_type: authority
canonical_path: docs/spatial/traversal-and-chokepoints.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/collision-and-route-rules.md`
- `docs/map/station-placement.md`
- `docs/map/shop-and-service-placement.md`
- `docs/map/district-boundaries.md`

# Traversal and Chokepoints

Traversal rules define how wide roads are, how doors work, and when a chokepoint is acceptable. Old Town is designed for click-to-move gameplay. Every traversal decision must respect the 600ms tick and the integer tile world.

## Traversal Rules

1. **Main roads are 3-5 tiles wide.** Spoke roads from Market Bell to primary districts need 4-5 tiles. District entrance roads need 3 tiles. This allows multiple players to pass without blocking.
2. **Market plaza is broad.** Market Bell centre needs at least 6x6 open tiles for social gathering, trading, and event space.
3. **Shop doors are 2 tiles wide.** Every shop entrance must have 2 walkable tiles. Single-tile doors create player collision bottlenecks.
4. **Cellar stairs are 1-2 tiles allowed.** Sootcellar and crypt stairs may be 1-2 tiles wide because they are threshold spaces, not throughput spaces. But they must not be the only route between two districts.
5. **Gravegate has a visible threshold.** The iron gate at Gravegate entrance is a collision object with 2-tile width. Players see it before they reach it. The gate teaches danger escalation.
6. **Resource nodes need 2 approach tiles.** Every resource node must have at least 2 adjacent walkable tiles so multiple players can gather without blocking each other.
7. **Stations need 2 adjacent tiles.** Every skilling station needs 2+ interactable approach tiles. See [`station-placement.md`](../map/station-placement.md).
8. **NPCs are not on critical path.** No essential NPC sits on a tile that is the only route between two districts. Every NPC must have at least 2 escape routes if blocked.
9. **Monsters do not overlap doors, banks, shops, or stations.** Hostile spawn zones must not have their home points within 2 tiles of any essential interactable. Pressure comes from proximity, not obstruction.
10. **Bridges and shortcuts are explicit.** A bridge over a river or a shortcut alley must be visually distinct from the main road. Players should recognise it as a choice.
11. **One-tile passes need gameplay reason.** Any passage that is only 1 tile wide must have a clear design purpose: a threshold, a secret, a quest gate, or a danger funnel. Never a 1-tile wide main road.

## Chokepoint Design

| Chokepoint Type | Width | Purpose | Example |
|-----------------|-------|---------|---------|
| District gate | 2-3 tiles | Threshold, readable danger | Gravegate iron gate |
| Cellar stairs | 1-2 tiles | Descent into Under space | Sootcellar hatch |
| Alley shortcut | 2 tiles | Optional route with pressure | Sootcellar to Warden Steps |
| Bridge | 2 tiles | River crossing, explicit choice | River Stoop ferry approach |
| Quest gate | 1-2 tiles | Temporary barrier | Future content |

## Collision and Flow

- **Throughput spaces** (roads, plazas, shop floors) must never be 1 tile wide.
- **Threshold spaces** (gates, stairs, secret doors) may be 1-2 tiles wide because they are choices, not defaults.
- **Danger funnels** (crypt entrances, quarry faces) may be tight because the tightness is part of the teaching.

## See also

- [`docs/map/collision-and-route-rules.md`](../map/collision-and-route-rules.md) — Collision bitmask rules
- [`docs/map/station-placement.md`](../map/station-placement.md) — Station tile placement
- [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) — Shop entrance rules

---

*Last updated: 2026-05-31*

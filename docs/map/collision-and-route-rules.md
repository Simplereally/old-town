---
doc_type: authority
canonical_path: docs/map/collision-and-route-rules.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/map/district-boundaries.md`
- `docs/map/creature-spawn-placement.md`
- `docs/map/npc-placement.md`
- `docs/world/districts-and-routes.md`

# Collision and Route Rules

Old Town uses tile bitmask collision. Movement blocking is directional bitmask flags, not physics. Every tile has a collision byte that defines which directions are blocked.

## Road Width Rules

| Road Type | Width (tiles) | Where Used |
|-----------|---------------|------------|
| Main spoke | 4-5 | Market Bell to each primary district |
| District entrance | 3 | Where a spoke enters a district boundary |
| Alley | 2 | Between districts, shortcuts, back routes |
| Shop door | 2+ | Every shop entrance |
| Station approach | 2+ | Tiles leading to station interact tiles |
| Resource approach | 1+ | At least 1 clear tile to every node |

## Collision Rules

1. **Main roads are walkable.** No collision flag on spoke tiles except for decorative objects that do not block movement.
2. **Shop doors are walkable.** Entrance tiles must have no collision. Door frames may have collision on the sides.
3. **Stations need 2+ adjacent interact tiles.** See [`station-placement.md`](station-placement.md).
4. **Resource nodes need clear approach.** Every node must have at least 1 adjacent walkable tile.
5. **Monster spawns must not overlap safe tiles.** Market Bell, Counting House, and Warden Steps have no hostile spawn zones.
6. **Sootcellar can be tighter.** Narrower alleys, more collision, darker corners. This is intentional.
7. **Gravegate is visually gated.** The iron gate at (56, 16) to (58, 16) is a collision object that players must open or walk around. The gate teaches danger escalation.
8. **No essential NPC in chokepoints.** Every NPC must have at least 2 escape routes if their tile is blocked by another player.

## Route Design: 6 Starter Loops

Starter loops are district sequences that teach the town layout. Each loop starts at Market Bell and returns to Market Bell.

| Loop | Name | District Sequence | What It Teaches |
|------|------|-------------------|-----------------|
| A | Spawn to Bank to Rats | Market Bell, Counting House, Sootcellar, Market Bell | Safety, storage, first combat, return |
| B | Full Penny | Market Bell, Foundry Row, North Quarry Road, Foundry Row, Market Bell | Mining, Smithing, ore loop, forge return |
| C | Full Lath | Market Bell, Lath Yard, Oldroad Gate, Lath Yard, Market Bell | Woodcutting, Bowcraft, tree loop, bowyer return |
| D | Full Patch | Market Bell, Patch Lane, Market Bell | Trapping, Tailoring, tanning, short loop |
| E | Full Chalk | Market Bell, Chalkhouse Court, River Stoop, Chalkhouse Court, Market Bell | Beadwork, Magic, clay and firing, cross-district loop |
| F | First Mystery | Market Bell, Oldroad Gate, Sootcellar, Warden Steps, Market Bell | Sleight, Cartography, investigation, cross-town routing |

## Route Validation Rules

1. Every loop must be completable without crossing a danger zone on the outbound leg. The return leg may teach danger as a shortcut.
2. Loop A must not require combat on the first leg. The player can reach Counting House safely from spawn.
3. Loop B must have a safe path from Foundry Row to North Quarry Road that avoids Mud Goblin spawns. The goblin zone pressures the better ore, not the road itself.
4. Loop C must have a safe path from Lath Yard to Oldroad Gate. Stray Dogs are on the gate edges, not the road center.
5. Loop D is intentionally short. It teaches that not every loop needs to leave the hub spoke.
6. Loop E crosses from Chalkhouse Court to River Stoop. The path must not pass through Gravegate.
7. Loop F is the longest. It teaches that some quests require walking across multiple districts.

---

*Last updated: 2026-05-31*

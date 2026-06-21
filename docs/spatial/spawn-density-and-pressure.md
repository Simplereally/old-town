---
doc_type: authority
canonical_path: docs/spatial/spawn-density-and-pressure.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/creature-spawn-placement.md`
- `docs/map/first-30-minute-paths.md`
- `docs/spatial/safe-danger-gradient.md`
- `docs/spatial/monster-movement-and-leashing.md`

# Spawn Density and Pressure

Spawn density controls how crowded a zone feels and how much combat pressure the player experiences. Density is not just about creature count. It is about the rhythm of encounter, retreat, and return.

## Density Bands

| Band | Creatures Alive | Feel | Example Zones |
|------|-----------------|------|---------------|
| **Sparse** | 1-2 | Lonely, atmospheric, occasional threat | Gravegate threshold, Shrine Hearth edge |
| **Light** | 3-5 | Active but manageable. Time to breathe between fights | Oldroad Gate, Patch Lane edge |
| **Medium** | 6-10 | Constant presence. Requires attention or route planning | Sootcellar deeper rooms, North Quarry Road face |
| **Dense** | 10+ | Overwhelming if engaged fully. Teaches kiting, retreat, or group play | Event zones, future wild areas |
| **Scripted** | Variable | Spawns only under specific conditions. Quest, event, or time-based | Ash Drake Whelp lair, contract spawns |

## Starter Area Rules

1. **Market Bell is zero hostile.** No creature spawns in Market Bell except event pests. The hub is sacred.
2. **Counting House is safe above, rats below.** The bank floor is safe. The cellar beneath (if accessed) has light rat density.
3. **Sootcellar first room is light.** The entrance room has 1-2 Cellar Rats. Deeper rooms escalate to medium with Soot Rats and cutpurses.
4. **North Quarry Road starter is safe, better is pressured.** The road from Foundry Row to the quarry face is sparse. The tinstone cluster at the face has medium goblin density.
5. **Gravegate is sparse but scary.** Only 1-2 Grave Mites and 1 Grave Wisp at any time. The fear comes from ground type, lighting, and sound, not numbers.
6. **Oldroad Gate has crows and dogs.** Light density. Crows are passive. Dogs are defensive on the alley approach. The road centre remains safe.
7. **Patch Lane foxes flee.** Light density. Bog Foxes are passive and skittish. They add life without pressure unless the player chases.
8. **River Stoop snappers are static.** Sparse density. 1-2 River Snappers at the bank edge. They do not wander. The dock remains safe.
9. **Old Kiln is quest-only.** The Ash Drake Whelp lair is scripted. No ambient spawns. The kiln exterior is safe.

## Density and Resource Pressure

| Resource Tier | Density Rule |
|---------------|--------------|
| Starter nodes (copper, ash, shrimp) | Sparse or zero. Always safe to approach. |
| Better nodes (tinstone, oak, trout) | Light to medium. Creature proximity creates pressure. |
| Advanced nodes (iron, maple, salmon) | Medium to dense. Future zones. |
| Rare nodes (mithril, yew, lobster) | Dense or scripted. Future zones. |

## See also

- [`docs/map/creature-spawn-placement.md`](../map/creature-spawn-placement.md) — Spawn zone coordinates
- [`docs/map/first-30-minute-paths.md`](../map/first-30-minute-paths.md) — Player path sequences
- [`docs/spatial/safe-danger-gradient.md`](safe-danger-gradient.md) — Danger zone definitions

---

*Last updated: 2026-05-31*

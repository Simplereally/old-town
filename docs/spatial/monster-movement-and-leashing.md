---
doc_type: authority
canonical_path: docs/spatial/monster-movement-and-leashing.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/creature-spawn-placement.md`
- `docs/spatial/movement-ecology.md`
- `docs/creatures/starter-creatures.md`
- `docs/creatures/combat-roles.md`
- `docs/spatial/spawn-density-and-pressure.md`

# Monster Movement and Leashing

Creature spawn data defines not just where monsters appear, but how they move, how far they chase, and what happens when the player flees. Leashing is the system that keeps danger readable and prevents monsters from ruining safe spaces.

## Creature Spawn Data Model

Every creature spawn zone needs the following fields:

| Field | Description |
|-------|-------------|
| **creature_id** | Content JSON creature identifier |
| **home_zone** | District or named sub-area where this spawn lives |
| **spawn_points_or_spawn_area** | Exact tiles or bounding box for spawn |
| **movement_type** | One of the 10 movement ecology types |
| **wander_radius** | Tiles from home point the creature may wander |
| **aggro_radius** | Tiles at which creature becomes aggressive |
| **chase_radius** | Tiles the creature will pursue before leash triggers |
| **leash_radius** | Maximum distance from home before forced return |
| **return_behavior** | How the creature returns: walk, snap, or fade |
| **safe_reset_boundary** | Zone boundary where creature resets if crossed |
| **respawn_ticks** | Game ticks between respawns after death |
| **spawn_cap** | Maximum alive at once from this zone |
| **group_behavior** | Solo, pair, cluster, or pack |
| **can_block_resource_node** | Whether this spawn may sit on a node tile |
| **can_enter_safe_zone** | Whether this spawn may cross into safe districts |
| **quest_state_overrides** | Spawn changes when quest state changes |

## Aggression Types

| Aggression Type | Behaviour | Example |
|-----------------|-----------|---------|
| **Passive** | Never attacks unless attacked first | Bog Fox, Road Crow, Cellar Rat |
| **Defensive** | Attacks if player enters aggro radius or attacks first | Stray Dog, Bell Bat, River Snapper |
| **Territorial** | Aggressive within home zone. Calms if player leaves zone | Mud Goblin, Grave Mite, Grave Wisp |
| **Road-threat** | Aggressive on specific routes or chokepoints | Stray Dog on alley approaches |
| **Ambush** | Hidden until player enters trigger zone. Then attacks | Blacksealed Cutpurse in Sootcellar shadows |
| **Contract-only** | Inactive unless player has active Wardenry contract | Some rare spawns, event creatures |
| **Miniboss** | High aggro, long leash, lair-bound. Special mechanics | Ash Drake Whelp |

## Leash Rules

1. **No safe zone chasing.** A creature that leaves its home zone must not enter a safe district (Market Bell, Counting House, Warden Steps). If the player kites a creature toward a safe zone, the creature leashes before crossing the boundary.
2. **Return via pathing.** When leashed, a creature walks back to its home point using normal pathfinding. It does not teleport unless stuck for 10+ ticks.
3. **Snap home if stuck.** If a creature cannot path home for 10 ticks, it snaps to its home tile and resets. This prevents creatures from getting trapped behind collision.
4. **Protect better resources, not basics.** Creatures with `can_block_resource_node = true` may only block advanced nodes (tinstone, oak, etc.). Starter nodes (copper, ash, etc.) are always safe to approach.
5. **Starter nodes are safe.** No hostile spawn may have its home point within 3 tiles of a starter resource node. Pressure comes from proximity, not overlap.
6. **Miniboss lair boundaries.** Minibosses have hard lair boundaries. They cannot leave the lair under any circumstances. The lair entrance is a visible threshold.
7. **Quest-triggered clean despawn.** Quest-triggered spawns despawn cleanly when the quest advances. They do not drop loot on despawn. They fade or walk offscreen.

## Starter Creature Spatial Rules

| Creature | Movement Type | Aggression | Home Zone | Spatial Role |
|----------|---------------|------------|-----------|--------------|
| **Cellar Rat** | Micro-wander | Passive / Defensive | Sootcellar room | Safe first combat target. Teaches basic attack and loot. |
| **Soot Rat** | Skulk | Territorial | Sootcellar deeper rooms | Disease hint. Teaches corner checking and skulk behaviour. |
| **Stray Dog** | Route patrol | Defensive / Road-threat | Oldroad Gate alley | Pursuit teaching. First enemy that chases on a route. |
| **Mud Goblin** | Local patrol | Territorial | North Quarry Road | Guards better ore. Teaches patrol loop reading and resource pressure. |
| **Bell Bat** | Roost/return | Defensive | Warden Steps roof / Lath Yard edge | Magic teaching. First ranged enemy. Returns to roost when threatened. |
| **Bog Fox** | Skittish flee | Passive | Patch Lane south edge | Trapping crossover. Flees toward snare points. Teaches skittish behaviour. |
| **Grave Mite** | Slow micro-wander | Territorial | Gravegate crypt mounds | Rot pressure. Slow but persistent. Teaches status effects. |
| **Grave Wisp** | Tethered spirit | Territorial / Magic | Shrine Hearth edge / Gravegate | Favour and Argent teaching. Bound to shrine boundary. |
| **Ash Drake Whelp** | Lair leash | Miniboss / Quest | Foundry Row old kiln | Never town-wanders. Hard lair boundary. First miniboss tease. |
| **Blacksealed Cutpurse** | Skulk | Defensive | Sootcellar entrance / Market Bell alley | Sleight and rogue theme. Hides in shadows. Teaches skulk detection. |
| **Road Crow** | Route / Roost | Passive | Oldroad Gate trees | Feather source. Low threat. Roosts in trees, walks roads. |
| **River Snapper** | Static / Water-edge | Defensive | River Stoop bank | Fishing crossover. Static at water edge. Teaches edge combat. |

## See also

- [`docs/map/creature-spawn-placement.md`](../map/creature-spawn-placement.md) — Spawn zone coordinates
- [`docs/spatial/movement-ecology.md`](movement-ecology.md) — Movement type definitions
- [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) — Creature stats and drops
- [`docs/creatures/combat-roles.md`](../creatures/combat-roles.md) — Combat teaching roles

---

*Last updated: 2026-05-31*

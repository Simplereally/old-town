---
doc_type: authority
canonical_path: docs/spatial/movement-ecology.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/creatures/starter-creatures.md`
- `docs/map/npc-placement.md`
- `docs/map/creature-spawn-placement.md`
- `docs/spatial/monster-movement-and-leashing.md`

# Movement Ecology

Every NPC and creature in Old Town has a movement type. Movement type determines how the entity behaves in space, how predictable it is, and what it teaches the player about the world.

## Core Rule

**Random walk forever is banned unless explicitly chosen for harmless flavour NPCs.**

A chicken pecking in a yard may wander randomly. A goblin guarding ore must not. Random movement destroys spatial readability and makes danger unpredictable in the wrong way.

## Movement Types

| Movement Type | Description | Used By |
|---------------|-------------|---------|
| **Static** | Does not move. May rotate or animate in place. | River Snapper, shopkeepers, station NPCs, quest objects |
| **Micro-wander** | Small radius wander within a room or tight zone. Returns to centre if disturbed. | Cellar Rat, Grave Mite, Soot Rat |
| **Local patrol** | Walks a short loop within one district or zone. | Mud Goblin, Warden guards, graveyard keepers |
| **Route patrol** | Walks a named road or alley between two points. | Stray Dog, Road Crow, town criers |
| **Roost/return** | Has a home tile. Ventures out, then returns. May flee to roost when threatened. | Bell Bat, Road Crow, some birds |
| **Skittish flee** | Flees from players on sight. May lead players toward traps or resources. | Bog Fox, some harmless wildlife |
| **Skulk** | Hides in corners, behind objects, or in shadows. Moves only when player is not looking directly. | Blacksealed Cutpurse, Soot Rat |
| **Tethered spirit** | Bound to a specific object or shrine boundary. Cannot leave tether radius. Aggroes if player enters tether. | Grave Wisp, some Favour-bound entities |
| **Lair leash** | Aggressive within lair boundary. Returns to lair centre if player leaves leash radius. Never wanders far. | Ash Drake Whelp, minibosses |
| **Quest-triggered** | Inactive until quest state changes. Then adopts one of the above types. | Quest-specific spawns, event creatures |

## Movement Assignment Rule

Every NPC and creature in content JSON must have a movement type assigned. No entity may spawn without one. The movement type is part of the creature's spatial identity, not an afterthought.

## Movement and Teaching

| Movement Type | What It Teaches |
|---------------|---------------|
| Static | This thing is part of the terrain. Interact with it. |
| Micro-wander | Danger is contained but not fixed. Watch the room. |
| Local patrol | This zone is claimed. Learn the patrol loop to pass safely. |
| Route patrol | Roads have life. Some routes are riskier than others. |
| Roost/return | Creatures have homes. You can predict where they will flee. |
| Skittish flee | Not everything wants to fight. Some things lead you places. |
| Skulk | Danger hides. Check corners. Listen for movement. |
| Tethered spirit | Sacred boundaries are real. Respect the shrine edge. |
| Lair leash | Some threats are contained but deadly within their bounds. |
| Quest-triggered | The world changes based on what you have done. |

## See also

- [`docs/spatial/monster-movement-and-leashing.md`](monster-movement-and-leashing.md) — Leash radii and aggression rules
- [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) — Creature list and stats
- [`docs/map/npc-placement.md`](../map/npc-placement.md) — NPC exact tiles

---

*Last updated: 2026-05-31*

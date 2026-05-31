---
doc_type: authority
canonical_path: docs/creatures/creature-system.md
parent_index: docs/creatures/00-index.md
root_index: docs/00-index.md
---

Parent: [`Creatures Index`](00-index.md)

Authority references:
- `POC_SPEC.md`
- `docs/creatures/drop-table-system.md`
- `docs/creatures/combat-roles.md`

# Creature System

Creatures are content definitions. AI, combat, death, respawn, drops, and ownership execute those definitions on the server.

## Required Creature Fields

| Field | Meaning |
|-------|---------|
| Creature ID | Stable kebab-case content ID |
| Name | Player-facing name |
| Region | Where it lives |
| Ecology role | Why it exists |
| Combat role | What it teaches |
| Aggression | Passive, defensive, aggressive |
| Movement | Wander, patrol, leash, stationary |
| Attack style | Melee, ranged, magic, special |
| Weakness | Weapon, style, or resource weakness |
| Drops | Common, uncommon, rare, unique |
| Skill links | What skills consume its drops |
| Wardenry contract | Whether it can be assigned |
| Trophy | Whether it has a trophy or keepsake |
| Respawn rhythm | Fast trash, normal, slow rare |

## Design Rules

1. Humanoids may drop crude equipment; beasts drop materials.
2. No early creature drops finished high-tier gear.
3. Drops must map to skills, quests, contracts, shops, or trophies.
4. Ground item ownership belongs to the killer or party for a tick-defined window.
5. Contract-only proof drops appear only while assigned by Wardenry.
6. Respawn rhythm must match reward value.
7. Server authority owns target validation, rolls, drops, ownership, and respawn.


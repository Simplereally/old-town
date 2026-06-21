---
doc_type: authority
canonical_path: docs/wardenry/contracts-and-task-generation.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: `docs/wardenry/wardenry-system.md`, `docs/wardenry/wardens-and-boards.md`, `docs/wardenry/contract-chains-and-marks.md`, `docs/wardenry/task-tables-starter.md`, `docs/wardenry/task-tables-first-ring.md`, `docs/wardenry/task-tables-second-ring.md`, `docs/wardenry/named-warrants-and-boss-tasks.md`, `docs/creatures/creature-system.md`, `docs/bosses/boss-system.md`, `docs/areas/area-progression-system.md`

# Contracts and Task Generation

Contracts are the atomic unit of the Wardenry system. Every contract is a directed task given by a Warden, completable solo, with a clear target, count, and reward. This document defines the ten canonical contract types, the rules that govern how a Warden generates contracts for a player, the format every contract must follow, and the hard constraints that keep the system fair and predictable.

## Contract Types

| Contract Type | Meaning | Example |
| **Cull** | kill a number of common creatures | Kill 12 Cellar Rats |
| **Proof** | bring proof drops | Bring 8 Rat Tails |
| **Posted** | kill target in specified area | Kill Mud Goblins on North Quarry Road |
| **Clearance** | clear a room/zone | Clear Sootcellar first room |
| **Warrant** | named humanoid/beast target | Kill Mudhook Grib |
| **Named Warrant** | boss task | Kill The Cellar King |
| **Patrol** | kill targets across route | Clear crows along Crowmile |
| **Grave Rite** | kill/offer proof at shrine | Bring Bone Chips to Lowgrave |
| **Risk Warrant** | higher danger, better marks | Sootstairs Cutpurses |
| **Notorious Hunt** | kill rare variant if it appears | Notorious Bell Bat |

## Contract Generation Rules

1. A Warden generates contracts based on the player's combat level and which area routes they have unlocked.
2. Contracts are never random. They are drawn from the Warden's predefined task table, filtered by level band and availability.
3. Posted Contracts are more common for first-ring Wardens because their areas have distinct sub-zones and road segments.
4. Named Warrants are rare and opt-in. A player must explicitly accept a Named Warrant; it is never forced.
5. Risk Warrants are only given by high-level Wardens (Falsewick, Redcord, Bailiff) and only to players whose combat level meets the danger threshold.
6. Notorious Hunts are generated only when a Notorious Variant of a creature is currently active in the world. They appear as a special contract type with a time window.
7. The player can always decline a contract without penalty, except when doing so breaks an active contract chain.

## Contract Format

Every contract in the system must expose the following fields:

| Field | Description |
| giver | Which Warden assigned the contract |
| target | Creature or boss ID being targeted |
| count | How many kills or proofs required |
| type | Contract type from the 10 canonical types |
| area | Where the contract must be completed |
| danger | Safe, Risky, or Dangerous |
| skills | Skills or items that help with the contract |
| drops | What drops are boosted while the contract is active |
| reward | Marks and XP given on completion |
| unlocks | What the player can unlock with marks earned |

## Contract Rules

1. Every contract must be completable solo. The system never assumes a group.
2. No contract requires a group. Grouping is optional and never mandatory.
3. No contract requires daily participation. There are no daily login bonuses or daily-exclusive contracts.
4. Contracts do not expire. A player can hold a contract indefinitely until they complete or abandon it.
5. The player can have only one active contract at a time. Accepting a new contract replaces the current one.
6. Contracts do not stack. Kills or proofs from a previous contract do not carry over to a new one.

## Related Systems

- [Wardenry System](wardenry-system.md) — marks, chains, and the Wardenry loop
- [Wardens and Boards](wardens-and-boards.md) — Warden directory and unlock rules
- [Contract Chains and Marks](contract-chains-and-marks.md) — chain progression and mark economy
- [Task Tables: Starter](task-tables-starter.md) — Holt's contract table
- [Task Tables: First Ring](task-tables-first-ring.md) — first-ring Warden tables
- [Task Tables: Second Ring](task-tables-second-ring.md) — second-ring Warden tables
- [Named Warrants and Boss Tasks](named-warrants-and-boss-tasks.md) — boss contract rules
- [Creature System](../creatures/creature-system.md) — creature IDs and drop tables
- [Boss System](../bosses/boss-system.md) — boss encounter rules
- [Area Progression System](../areas/area-progression-system.md) — how routes unlock and affect contract availability

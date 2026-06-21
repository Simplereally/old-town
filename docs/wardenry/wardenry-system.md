---
doc_type: authority
canonical_path: docs/wardenry/wardenry-system.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

**Authority references:**
- docs/wardenry/wardens-and-boards.md
- docs/wardenry/contracts-and-task-generation.md
- docs/wardenry/contract-chains-and-marks.md
- docs/wardenry/cancel-skip-block-extend.md
- docs/wardenry/named-warrants-and-boss-tasks.md
- docs/wardenry/warden-locker-rewards.md
- docs/skills/utility-skills.md
- docs/creatures/creature-system.md
- docs/bosses/boss-system.md
- docs/quests/quest-system.md

# Wardenry System

Wardenry is Old Town's combat guidance system. It gives players structured reasons to fight creatures, complete objectives, and earn rewards, without forcing a specific playstyle or locking content behind daily obligations.

## Wardenry Definition

Wardenry is the town making combat useful. It is not "kill random monsters." It is a system where NPC Wardens assign Contracts with specific targets, locations, and rewards. Players complete these Contracts to earn Warden Marks, which unlock tools, cosmetics, and utility in the Warden Locker. Free-killing creatures outside of Contracts remains fully valid. Contracts add structure and improved drops, not a mandatory path.

## What Wardenry Is Not

| Bad idea | Why it is bad | What to use instead |
| **Daily lock** | Creates obligation anxiety and punishes inconsistent play | Repeatable contracts with no lock |
| **Bounty board** | Generic, no identity, feels like a spreadsheet | Wardens with personality and area ties |
| **Faction/reputation** | Locks content behind grind walls | Skill and area access only |
| **Battle pass** | Time-limited, FOMO-driven, disrespects player time | Permanent Warden Locker |
| **Universal damage boost** | Power creep that collapses all combat design | Narrow utility items |
| **Best-in-slot drop** | Collapses progression by making one item mandatory | Cosmetics and narrow utility |
| **Kill quota** | Turns fun combat into a checklist chore | Flexible kill counts with proof options |
| **Group-required** | Excludes solo players from core content | Solo-viable with group benefits |
| **Scoreboard** | Encourages speedrunning and toxicity | Personal chain tracker |
| **Boss-exclusive skill** | Locks content behind one boss encounter | All skills trainable in open world |

## Wardenry Identity

Every contract must answer these ten questions:

1. Who assigned it? (Which Warden, and why them specifically?)
2. What is the target? (Creature, object, or boss.)
3. Where must it be done? (Specific area or open world.)
4. How many kills or proofs are required?
5. What is the danger level? (Recommended combat level, gear, and risk.)
6. What skills or items help? (Warden Kit, utility skills, consumables.)
7. What drops are boosted while on contract?
8. What is the completion reward? (Marks, XP, items.)
9. What mark unlocks does it contribute to?
10. What is the repeat value? (Worth doing again, or one-and-done?)

## Wardenry Terms

| OSRS-like concept | Old Town term | Meaning |
| Slayer Master | Warden | task-giving NPC |
| Task | Contract | assigned kill/proof objective |
| Slayer points | Warden Marks | task reward currency |
| Task streak | Contract Chain | consecutive completed contracts |
| Block task | Refuse | pay marks to block a task family |
| Cancel task | Tear Up | pay marks to cancel current contract |
| Extend task | Widen | pay marks to increase count/reward |
| Superior monster | Notorious Variant | rare stronger spawn while on task |
| Boss task | Named Warrant | boss kill assignment |
| Location-specific task | Posted Contract | must be completed in named area |
| Slayer equipment | Warden Kit | task tools and protections |
| Reward shop | Warden Locker | unlocks, tools, cosmetics, contracts |

## Wardenry and Skills

Wardenry is a utility skill with levels 1-99. It trains by completing Contracts and earning marks. Higher Wardenry levels unlock better Wardens, harder Contracts, and more Locker options. See [docs/skills/utility-skills.md](../skills/utility-skills.md) for the full utility skill framework.

## Wardenry and Bosses

Bosses can appear as Named Warrants, rare high-value Contracts assigned by senior Wardens. These are opt-in and uncommon. Boss Warrants do not lock any skill or content. See [docs/bosses/00-index.md](../bosses/00-index.md) for boss design and [named-warrants-and-boss-tasks.md](named-warrants-and-boss-tasks.md) for the warrant system.

## Wardenry and Wardens

Wardens are NPCs with personalities, locations, and unlock requirements. They are not anonymous bounty boards. Each Warden has preferred contract types, favored areas, and unique dialogue. See [wardens-and-boards.md](wardens-and-boards.md) for the full Warden roster.

## Related Systems

- [wardens-and-boards.md](wardens-and-boards.md) — Warden NPCs and unlocks
- [contracts-and-task-generation.md](contracts-and-task-generation.md) — contract types and generation
- [contract-chains-and-marks.md](contract-chains-and-marks.md) — chains and currency
- [cancel-skip-block-extend.md](cancel-skip-block-extend.md) — reroll and modify contracts
- [named-warrants-and-boss-tasks.md](named-warrants-and-boss-tasks.md) — boss assignments
- [warden-locker-rewards.md](warden-locker-rewards.md) — reward shop
- [docs/skills/utility-skills.md](../skills/utility-skills.md) — Wardenry as utility skill
- [docs/creatures/00-index.md](../creatures/00-index.md) — creature ecology
- [docs/bosses/00-index.md](../bosses/00-index.md) — boss encounters
- [docs/quests/00-index.md](../quests/00-index.md) — quest integration

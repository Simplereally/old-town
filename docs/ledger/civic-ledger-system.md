---
doc_type: authority
canonical_path: docs/ledger/civic-ledger-system.md
parent_index: docs/ledger/00-index.md
root_index: docs/00-index.md
---

Parent: [`Ledger Index`](00-index.md)

Authority references:
- `docs/ledger/district-deeds.md`
- `docs/ledger/oldroad-trails.md`
- `docs/ledger/charters-and-permits.md`
- `docs/ledger/rewards-and-stamps.md`
- `docs/world/npc-cast.md`
- `docs/world/districts-and-routes.md`
- `docs/content/schema-gap-analysis.md`
- `docs/content/seed-shops-services-ledger-manifest.md`

# Civic Ledger System

The Civic Ledger is Old Town's long-term account of player deeds. It tracks what a player has done in the world, not what they own. The ledger lives at the Counting House, but its keepers are scattered across every district.

## Ledger Keepers

| Keeper | Location | Role |
|--------|----------|------|
| Tomas Tally | Counting House | Keeps the formal record. Every deed, stamp, and charter passes through his ledger book. |
| Finch Quill | Oldroad Gate | Handles maps and routes. Sketches trail steps, surveys landmarks, and marks hidden paths. |
| Warden Holt | Warden Steps | Stamps dangerous work. Signs off on combat deeds, contract completions, and hazardous trails. |
| Sister Writ | Shrine Hearth | Records shrine rites. Blesses ledger progress and ties deeds to Favour. |
| Marn Lock | Sootcellar | Can "adjust" records. Knows blacksealed trails, forges permits, and trades in secrets. |

## Deed Tiers

Every district deed card has four tiers. Each tier unlocks when the previous tier's tasks are complete.

| Tier | Name | Meaning | Reward Type |
|------|------|---------|-------------|
| 1 | Errand | Small tasks anyone can do. Fetch, deliver, craft one item, visit one place. | Small convenience item or local tip |
| 2 | Stamped | Tasks that require skill or danger. Smelt a bar, catch a fish, win a contract. | Shop discount, minor service, or local reputation |
| 3 | Chartered | Tasks that prove mastery. Build something, complete a quest, finish a trail. | Route unlock, station access, contract tier, or nook blueprint |
| 4 | Mastered | Tasks that define a district legend. Rare drops, perfect crafts, hidden discoveries. | Cosmetic, cape trim, rare utility item, or district title |

## Player Language

Players should speak about the ledger in plain terms.

| Phrase | Meaning |
|--------|---------|
| "I got my Foundry Stamp" | Completed the Foundry Row deed card to Stamped tier |
| "I am Chartered in Patch" | Completed Patch Lane to tier 3 |
| "Tomas stamped my ledger" | Turned in a deed tier for rewards |
| "Finch gave me a trail" | Received an Oldroad Trail from Finch Quill |
| "Marn fixed my record" | Used a blacksealed service to bypass or alter a requirement |
| "I need one more deed for Mastered" | One task away from tier 4 in a district |

## Design Rules

1. **No daily tasks.** The ledger never resets. Progress is permanent and player-driven.
2. **No battle pass.** There is no seasonal track, no premium tier, and no time-limited bar to fill.
3. **No universal BiS gear.** Ledger rewards give world authority, not power creep. A Mastered cape is cosmetic. A Chartered route is access. A Stamped discount is economic.
4. **Deeds are content-driven.** Each district deed card is defined in JSON, not hardcoded. Tasks reference items, NPCs, and locations by ID.
5. **Trails come from play.** Skilling, combat, and exploration all produce trails. No trail is bought from a shop.
6. **Permits are smaller than charters.** A permit unlocks a door. A charter unlocks a life.
7. **Nooks are built, not bought.** A player must gather planks and fittings, then build the nook at the correct location.
8. **Public works are repeatable.** Any player can do a public work at any time. There is no daily lockout, no FOMO, and no exclusive window.

## Relationship to Other Systems

| System | Ledger Connection |
|--------|-------------------|
| Favour | Sister Writ blesses deed progress. Shrine rites count as ledger tasks. |
| Wardenry | Warden contracts count toward deed tiers. Warden Holt stamps combat deeds. |
| Cartography | Finch Quill's surveys and route unlocks are ledger rewards and trail steps. |
| Sleight | Marn Lock's blacksealed trails and forged permits are ledger content. |
| Skills | Crafting, gathering, and combat tasks fill deed cards. Skilling produces trails. |
| Quests | Quest completions count as Chartered-tier tasks. Some quests reward trails directly. |

---

*Last updated: 2026-05-31*

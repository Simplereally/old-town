---
doc_type: authority
canonical_path: docs/guilds/entry-requirements.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

Parent: [Guilds Index](00-index.md)

# Guild Entry Requirements

This document defines the eight entry requirement types for guilds and the patterns that are banned from use. It is the authority for how a player gains access to a guild building, room, or benefit.

Authority references: `docs/guilds/guild-system.md`, `docs/guilds/first-ring-guilds.md`, `docs/guilds/second-ring-guild-seeds.md`, `docs/skills/skill-system.md`, `docs/areas/area-progression-system.md`, `docs/ledger/charters-and-permits.md`, `docs/quests/quest-system.md`.

---

## Requirement Types

| ID | Name | What it means | Example | Gate type |
|---|---|---|---|---|
| `skill_level` | Skill level | A minimum level in a specific skill. | 40 Smithing for the high-tier anvil. | Hard |
| `quest_completion` | Quest completion | A specific quest must be finished. | `The Shift Bell Rings Twice` for Foundry Hall. | Hard |
| `item_possession` | Item possession | The player must carry or own a specific item. | Gravegate Permit for Grave Underways access. | Hard |
| `area_unlock` | Area unlock | A route or region must be reachable on the world map. | Lowgrave route open for Sootstairs Rooms. | Soft |
| `combat_ability` | Combat ability | A specific creature or challenge must be defeated. | Defeat Mudhook Grib for Tallyhouse Bank cellar. | Hard |
| `tool_requirement` | Tool requirement | A specific tool must be equipped or owned. | Wardensteel Pickaxe for Tinstone Cut deep vein. | Soft |
| `favour_requirement` | Favour requirement | A minimum Favour level. | Level 25 Favour for Chalkhouse kiln discount. | Soft |
| `cartography_unlock` | Cartography unlock | A road or area must be mapped. | Mapped Crowmile Road for Crowmile Cartwright. | Soft |

A hard gate blocks entry entirely. The player cannot enter the building, use the object, or receive the service until the requirement is met. A soft gate blocks a specific benefit or room but still lets the player enter the building and use the basic services. For example, you can walk into Foundry Hall at any time, but you cannot use the high-tier anvil without 40 Smithing.

---

## Hard Gates vs Soft Gates

A hard gate is a wall. If you do not meet the requirement, you cannot pass. The door is locked, the NPC refuses to talk to you, or the object is inactive. Hard gates are used for guilds that represent a significant progression milestone or a dangerous area.

A soft gate is a filter. You can enter, but you cannot access everything. The NPC will talk to you but will not offer the premium service. The room is visible but roped off. Soft gates are used for guilds that serve a broad player base but reserve their best benefits for dedicated players.

The choice between hard and soft is a design decision documented in the guild's own entry. This document only defines the types.

---

## Requirement Combinations

Some guilds need more than one requirement. Combinations are documented in the guild entry and validated by the content system.

| Guild | Combination | Logic |
|---|---|---|
| Foundry Hall | Mining 20 + Smithing 20 + `The Shift Bell Rings Twice` | All three must be met. |
| Old Kiln House | `Smoke Over Old Town` + (Hearthcraft 20 OR Beadwork 20) | Quest mandatory; only one skill required. |
| Sootstairs Rooms | `Keys That Open Nothing` OR Sleight 20 | Either one is enough. |

The content validator checks that every requirement in a combination references a real skill ID, quest ID, item ID, or area ID. It also checks that the logic operator (AND or OR) is valid and that there are no more than three requirements in a single combination.

---

## Banned Patterns

The following requirement types are banned from all guild entries. They are listed here so that designers know what not to use and what to use instead.

| Banned pattern | Why it is banned | Use instead |
|---|---|---|
| Reputation points | Grindable numeric tracks that reset or decay. They create anxiety and encourage farming. | A specific quest or a skill level. |
| Long standing tracks | Requirements that take weeks of daily play. They punish casual players. | A single quest or a combat challenge. |
| Faction ranks | Tiered membership systems with multiple ranks. They add bureaucracy without depth. | A single hard gate or a soft gate. |
| Daily completions | Requirements that reset every day. They force a schedule. | A one-time quest or item. |
| Battle-pass language | Seasonal tracks, tiers, or premium unlocks. They are incompatible with the game's design philosophy. | Nothing. This pattern is not replaced. |
| Guild membership fees | Charging gold or items to join a guild. It creates a paywall for social content. | A skill level or quest. |
| Guild application quests | Multi-step approval processes with NPC interviews. They add friction without gameplay. | A single quest or a combat ability check. |
| Time-gated cooldowns | Requirements that can only be met after a real-time wait. They pad playtime artificially. | A skill level or an area unlock. |

---

## Player Shorthand

Players will compress requirements into short phrases. These are not canonical IDs, but they are useful for understanding how the community talks about progression.

- "Need 40 Smithing for Foundry Hall."
- "Bank at Tally's, smelt at Foundry."
- "Chalkhouse kiln is faster after the Beadwife quest."
- "Patch Yard is the hide spot."
- "Wardenbrook is better fish per trip."

Designers should anticipate this shorthand when naming guilds and writing NPC dialogue. An NPC at Foundry Hall might say, "You look like you bank at Tally's," as a nod to the common player route.

---

## Deferred to Implementation

The following details are intentionally left out of this document and will be defined during implementation:

- Exact level thresholds for each skill requirement. These are set per guild in the content JSON.
- Permit item JSON definitions. The `item_possession` type references items defined in `content/items/`.
- Quest flag system. The `quest_completion` type depends on the quest state machine, which is documented in `docs/quests/quest-system.md`.
- Cartography mapping rules. The `cartography_unlock` type depends on the map discovery system, which is documented in `docs/areas/area-progression-system.md`.
- Favour level thresholds. The `favour_requirement` type depends on the Favour system, which is documented in `docs/skills/skill-system.md`.

*Last updated: 2026-05-31*

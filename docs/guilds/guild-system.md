---
doc_type: authority
canonical_path: docs/guilds/guild-system.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

Parent: [Guilds Index](00-index.md)

Authority references:
- `docs/guilds/starter-skill-hubs.md`
- `docs/guilds/first-ring-guilds.md`
- `docs/guilds/second-ring-guild-seeds.md`
- `docs/guilds/entry-requirements.md`
- `docs/guilds/guild-services-and-shops.md`
- `docs/guilds/guild-resource-access.md`
- `docs/guilds/guild-quest-hooks.md`
- `docs/guilds/guild-rewards.md`
- `docs/skills/skill-system.md`
- `docs/areas/area-progression-system.md`
- `docs/ledger/charters-and-permits.md`
- `docs/world/districts-and-routes.md`

# Guild System

This document is the authority for what a guild is, what it is not, and how it fits into Old Town. A guild is a useful place to train a skill, not a faction to join. It has no politics, no reputation meter, and no daily chores. It exists because someone built a workshop, opened a yard, or cleared a space where a skill is easier to practice than in the wild.

## Guild Definition

A guild is a location that makes a specific skill or set of skills more convenient, more safe, or more rewarding. It is defined by what you do there, not by who you are. There is no guild membership, no guild chat, no guild bank, and no guild leader. The word "guild" is a player shorthand for "a place with good skilling stuff."

A guild is not a faction. It does not care about your allegiance. It does not give you quests because you are a member. It does not have a reputation track that unlocks tiers. It does not have daily tasks that reset at midnight. It does not sell best-in-slot equipment that only guild members can buy. It does not grant universal buffs that follow you everywhere.

A guild is also not a social club. Players may gather there because the anvils are close together or the furnace is free, but the building itself has no social system. The social layer is emergent, not engineered.

## Guild Categories

Every guild or hub in Old Town falls into one of seven categories. The category tells you what kind of convenience the place offers.

| Category | Definition | Old Town Example |
|----------|------------|------------------|
| **Starter Hub** | A basic training space inside Old Town with free or cheap access, intended for levels 1 to 20. | The sootcellar is a starter hub for low combat and Sleight. Foundry Row teaches Mining and Smithing, and Patch Lane teaches Trapping and Tailoring. |
| **Skill Guild** | A dedicated building or yard for one skill, with better tools, closer resources, or safer conditions than the wild. | Patchfield Tannery is a trade yard for Tailoring, Trapping, and bulk hide orders. |
| **Trade Yard** | A space with multiple vendors, processing stations, and buy/sell NPCs clustered for efficiency. | The market square near the charter house is a trade yard for bulk buying and selling. |
| **Route Hub** | A guild placed on a road, ferry, or under-way that serves travelers with repairs, supplies, and rest. | Crowmile Road Camp is a route hub for Wayfaring and road travellers. |
| **Combat Yard** | A place with dummy targets, sparring space, or controlled creature spawns for combat training. | Warden Steps is a combat yard for basic combat and Arms practice. |
| **Shrine Hub** | A location built around a shrine or rite circle, offering favour rites and spiritual services. | Shrine Hearth is a shrine hub for Favour rites and blessings. |
| **Underground Hub** | A guild in a cellar, under-way, or hidden space, often with restricted access and niche resources. | Sootstairs Rooms is an underground hub for Sleight and rare materials. |

Categories can overlap. A route hub might have a small shrine. A trade yard might have a combat yard next door. The primary category is the one that answers the question "why would a player come here instead of somewhere else?"

## Every Guild Must Answer

Before any guild or hub is added to the world, it must answer nine questions. If it cannot answer all nine, it is not ready to be built.

| Question | Why It Matters |
|----------|----------------|
| **What skill does this support?** | A guild without a skill is a building. The skill is the reason it exists. |
| **Where is it?** | It must have a specific district, area, or route. "Near town" is not enough. |
| **What level or quest unlocks it?** | There must be a gate. Free access devalues the skill and the world. |
| **What resources, stations, or services does it offer?** | Players need to know what they can do there that they cannot do elsewhere. |
| **What makes it better than training outside?** | Convenience, safety, speed, or cost. There must be a clear advantage. |
| **What does it not replace?** | It must not make wild training obsolete. The best resources stay in the world. |
| **Which NPC explains it?** | A local NPC must tell the player the guild exists and why they might care. |
| **What is the player shorthand?** | The name players actually use, not the formal building name. |
| **What quest or area does it connect to?** | It must tie into the broader world, not float in isolation. |

These questions are a design gate, not a checklist to fill after the fact. A guild that answers all nine will feel like a real place. A guild that skips even one will feel like a generic MMO feature.

## Player Shorthand

Players do not say "I am going to the Woodcutting Guild." They say "I am going to the copse" or "I am heading to the yard." The shorthand is local, specific, and often shared by word of mouth rather than by a map label.

| Shorthand | What Players Mean |
|-----------|-------------------|
| "the yard" | Any skill guild or combat yard, usually the one the player uses most |
| "the hub" | A route hub or trade yard, often the one on their usual travel path |
| "the cellar" | An underground hub, usually the sootcellar or sootstairs deep |
| "the shrine" | A shrine hub, often the one near their current district |
| "the market" | A trade yard, usually the main market square |
| "the drill" | The combat yard, specifically the barracks drill ground |
| "the tannery" | The Tailoring and Trapping trade yard in Patchfield |
| "the forge" | The Smithing skill guild, usually Foundry Hall or the Foundry Row district workshop |
| "the dock" | A route hub near water, usually Wardenbrook or Moth Ferry |
| "the deep" | An underground hub or under-way entrance |
| "I got my permit" | Unlocked a guild or area through a deed-tier permit |
| "Finch showed me the yard" | Heard about a guild from an NPC hint or quest |

## Banned Concepts

The following terms and concepts are banned from guild design. They carry baggage from other games that does not fit Old Town's local, low-fantasy culture.

| Banned Term | Why It Is Banned | What to Use Instead |
|-------------|------------------|---------------------|
| **Mining Guild** | Implies a faction with membership and ranks | `tinstone_cut`, local ore face, quarry yard |
| **Woodcutting Guild** | Implies a faction with membership and ranks | `bellwood_copse`, local wood lot, copse yard |
| **Fishing Guild** | Implies a faction with membership and ranks | `wardenbrook`, local fish spot, brook dock |
| **Adventurers' Guild** | Implies a generic quest hub for all players | route hub, combat yard, warden contract board |
| **Warriors' Guild** | Implies a faction with exclusive combat rewards | combat yard, sparring ground, weapon rack |
| **Mages' Guild** | Implies a faction with exclusive spell access | shrine hub, chalkhouse court, rite circle |
| **Thieves' Guild** | Implies a faction with exclusive stealth content | `sootstairs`, under-way hub, black market corner |
| **faction reputation** | Implies a standing system with tiers and grind | deed tier, local standing, permit |
| **standing tiers** | Implies a vertical reputation ladder | deed tiers, civic ledger tiers |
| **guild dailies** | Implies daily reset tasks | none. No daily resets. |
| **guild battle pass** | Implies a seasonal reward track | none. No seasonal tracks. |
| **best-in-slot guild weapons** | Implies exclusive equipment locked behind guild access | Equipment comes from crafting, drops, and trade. |
| **universal guild buffs** | Implies buffs that apply everywhere | none. Buffs are local and situational. |

## Deferred to Implementation

This document defines the system. It does not define the content. The following are intentionally left for future stories and implementation work.

| Deferred Item | Why It Is Deferred |
|---------------|--------------------|
| **Exact NPC dialogue** | Dialogue graphs need quest scripts and NPC placement first |
| **Shop stock JSON** | Item tables and prices need the full item registry and economy tuning |
| **Station interaction scripts** | Furnace, anvil, and crafting station logic needs engine implementation |
| **Guild interior maps** | Building layouts need the world editor and tile data pipeline |
| **Guild membership tracking** | Not applicable. Guilds have no membership system to track. |
| **Guild-specific quest flags** | Quest flags need the quest system and dialogue system first |
| **Guild reward item tables** | Reward tables need the full item registry and drop system |
| **Guild NPC spawn coordinates** | NPC placements need final area and interior layouts |
| **Guild entry requirement checks** | Permit and deed-tier validation needs the ledger system first |
| **Guild service pricing** | Prices need the economy model and playtest feedback |

## Related Documents

- `docs/guilds/starter-skill-hubs.md` — Starter hubs inside Old Town and their roles
- `docs/guilds/first-ring-guilds.md` — Guilds and hubs in the first ring areas
- `docs/guilds/second-ring-guild-seeds.md` — Future guild concepts for second ring areas
- `docs/guilds/entry-requirements.md` — Level, quest, and permit gates for guild access
- `docs/guilds/guild-services-and-shops.md` — Services, vendors, and station types
- `docs/guilds/guild-resource-access.md` — Resource quality and availability inside guilds
- `docs/guilds/guild-quest-hooks.md` — How quests introduce and connect to guilds
- `docs/guilds/guild-rewards.md` — What guilds offer and what they deliberately do not
- `docs/skills/skill-system.md` — Skill thresholds, equipment tiers, and training methods
- `docs/areas/area-progression-system.md` — Area rings, unlock conditions, and gate types
- `docs/ledger/charters-and-permits.md` — Deed tiers, permits, and ledger keepers
- `docs/world/districts-and-routes.md` — Old Town districts and starter routes

*Last updated: 2026-05-31*

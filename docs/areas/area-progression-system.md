---
doc_type: authority
canonical_path: docs/areas/area-progression-system.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/spatial/outer-area-seeds.md`
- `docs/spatial/naming-atlas.md`
- `docs/ledger/civic-ledger-system.md`
- `docs/skills/skill-system.md`
- `docs/world/districts-and-routes.md`
- `docs/spatial/traversal-and-chokepoints.md`
- `docs/quests/quest-system.md`

# Area Progression System

This document is the authority for how players move beyond Old Town. It defines the ring structure, the conditions that open new areas, the gates that block them, and the routes that connect them. Every area beyond the starter region must justify its existence with a local reason, not a global tier label.

## The Ring Concept

Old Town is the hub. Everything else orbits it in rings. The rings are a design shorthand, not a player-facing label. Players never see a "Ring 1" badge. They see a road sign, a locked gate, or a ferryman who refuses them.

| Ring | Areas | Relationship to Hub | Player Experience |
|------|-------|---------------------|-------------------|
| **Hub** | Old Town (13 districts) | Starting space, 96x96 tiles | Learn the town, meet NPCs, train skills to 20 |
| **First ring** | 8 areas | Visible from hub edges or short road extensions | First wild walks, new resources, harder creatures |
| **Second ring** | 7 areas | Named in dialogue and road signs before access | Longer journeys, group content, advanced skilling |
| **Future rings** | Unnamed | Reserved for post-launch expansion | Not designed yet. Named only when needed. |

The first ring areas are `crowmile_road`, `bellwood_copse`, `tinstone_cut`, `patchfield`, `wardenbrook`, `lowgrave`, `old_kiln`, and `sootstairs`. The second ring areas are `crownheart_forest`, `blackbar_cut`, `grave_underways`, `witchwood_verge`, `moth_ferry_crossing`, `carmine_yard`, and `argent_chapel_road`. See `docs/spatial/outer-area-seeds.md` for their full roles and directions.

## Unlock Conditions

No area opens because a player hits a global level. Areas open because the player has done something specific that makes the local barrier make sense.

| Unlock Type | What It Requires | Example |
|-------------|------------------|---------|
| **Skill threshold** | A specific skill level that justifies the local danger | `tinstone_cut` needs 15 Mining to justify better ore and more goblins |
| **Deed tier** | A Civic Ledger deed tier that proves local standing | `lowgrave` crypts need Stamped tier in Gravegate deeds |
| **Quest completion** | A specific quest that changes world state | `moth_ferry_crossing` opens after the ferryman quest restores the boat |
| **Route discovery** | Finding and walking a hidden or unmarked path | `bellwood_copse` has a hidden trail from Oldroad Gate that Cartography can reveal |
| **Permit gate** | A deed-tier permit that unlocks a physical gate | `blackbar_cut` gate opens with a Chartered-tier quarry permit |
| **Favour rite** | A shrine blessing that protects against an area hazard | `witchwood_verge` needs a Favour rite to ward against the wood's curse |
| **Warden contract** | Completion of a contract that clears an area for entry | `crownheart_forest` needs a Warden contract to thin the wolf packs |
| **Time of day** | A world-state gate tied to the game clock | `sootstairs` black market only opens after dusk |

Multiple unlock types can stack. `argent_chapel_road` might need a Favour rite, a Warden contract, and a deed-tier permit. The stacking is local and specific, not a generic "hard mode" flag.

## Gate Types

Gates are the physical or procedural barriers that enforce unlock conditions. Every gate must have a visible, in-world representation. No invisible walls.

| Gate Type | How It Blocks | How It Opens | Example |
|-----------|---------------|--------------|---------|
| **Blocked path** | Collapsed bridge, rockfall, overgrown trail | Skill action (Mining to clear, Woodcutting to chop, Wayfaring to find a way around) | Crowmile Road rockfall needs 10 Mining to clear |
| **Locked gate** | Physical gate with lock, key, or permit slot | Key item, permit item, or deed-tier check | Blackbar Cut gate needs `blackbar_permit` or Chartered quarry deed |
| **Ferry requirement** | Missing boat, broken dock, or ferryman refusal | Quest completion, item repair, or deed-tier reputation | Moth Ferry dock needs the ferryman quest and a `tinfin` payment |
| **Permit gate** | Guard or ward that checks deed tier | Show permit or meet tier threshold | Wardenbrook ford patrol checks for Stamped Warden Steps deed |
| **World-state gate** | Area changes based on quest or time | Complete the quest or wait for the state | Sootstairs black market only open after dusk; closes at dawn |
| **Under-way gate** | Descent into a lower plane or hidden space | Specific entrance action, skill check, or item | Sootstairs descent needs a `soot_lantern` and 20 Wayfaring |
| **Shortcut lock** | Hidden path that is faster but gated | Cartography survey or Wayfaring climb | Bellwood Copse shortcut from Foundry Row needs 25 Wayfaring |

Gates must respect traversal rules from `docs/spatial/traversal-and-chokepoints.md`. A locked gate should be 2-3 tiles wide and visually readable. A blocked path should look like a real obstacle, not a flat texture.

## Route System

Routes are the connective tissue between areas. They are not fast travel. They are walked, earned, and remembered.

| Route Type | What It Is | Skill Connection | Example |
|------------|-----------|------------------|---------|
| **Walking route** | A road or trail between two areas | Wayfaring reduces stamina cost and reveals hidden branches | Oldroad Gate to Crowmile Road is a 3-tile-wide dirt road |
| **Ferry route** | A water crossing by boat | Wayfaring unlocks ferry shortcuts and reduces wait time | Wardenbrook to Moth Ferry Crossing crosses the river |
| **Under-way** | A descent into a lower plane or tunnel | Wayfaring handles descent stamina; Cartography maps the under-way | Sootstairs to Sootstairs Deep is a stair descent with lantern checks |
| **Shortcut** | A hidden or faster path between known points | Cartography reveals it; Wayfaring unlocks it | Bellwood Copse to Foundry Row through a wolf gap |

Wayfaring governs stamina on long walks, climb checks at quarry faces, and ferry negotiations. Cartography governs map reveal, survey completion, and hidden path discovery. A player with high Wayfaring but low Cartography can walk far but will not see the shortcuts. A player with high Cartography but low Wayfaring can see the paths but will tire before reaching them.

Routes must follow road width rules from `docs/spatial/traversal-and-chokepoints.md`. Main roads between first ring areas are 3 tiles wide. Ferries have 2-tile dock approaches. Under-way stairs are 1-2 tiles wide because they are thresholds, not throughput spaces.

## Player Shorthand

Players should talk about area progression in local terms, not system terms.

| Shorthand | What Players Mean |
|-----------|-----------------|
| "the road" | Any first ring walking route, usually Crowmile Road |
| "the cut" | Tinstone Cut or Blackbar Cut, depending on context |
| "the copse" | Bellwood Copse |
| "the brook" | Wardenbrook |
| "the grave" | Lowgrave or Grave Underways |
| "the kiln" | The Old Kiln |
| "the stairs" | Sootstairs or any under-way descent |
| "first ring" | The eight immediate outer areas (design shorthand, may leak into player language) |
| "outer areas" | Any area beyond Old Town, vague and inclusive |
| "I got my permit" | Unlocked a deed-tier gate |
| "Finch showed me a trail" | Unlocked a Cartography route |
| "the ferry is running" | Moth Ferry Crossing is open after quest completion |

## Banned Concepts

The following concepts are banned from area progression design. They sound like generic MMO systems, not like Old Town local culture.

| Banned Term | Why It Is Banned | What to Use Instead |
|-------------|------------------|---------------------|
| **Zone levels** | Implies a global difficulty scale | Local skill thresholds, local creature danger, local resource quality |
| **Region tiers** | Implies a vertical gear check | Deed tiers, permit gates, local standing |
| **Expansion packs** | Meta commercial language | Rings, future areas, post-launch content |
| **DLC areas** | Meta commercial language | Future rings, unnamed spaces |
| **World levels** | Implies a global player power scale | Combat level for PvP brackets only; area access is local |
| **Dark Forest** | Generic fantasy name | `bellwood_copse`, `witchwood_verge`, `crownheart_forest` |
| **Dragon Cave** | Generic fantasy name | `old_kiln`, `kiln_ash_flats` |
| **Goblin Camp** | Generic fantasy name | `tinstone_cut`, `north_quarry_road` |
| **Mystic Tower** | Generic fantasy name | `chalkhouse_court`, `shrine_hearth` |
| **Ancient Ruins** | Generic fantasy name | `oldroad_gate`, `old_kiln` |
| **Shadowlands** | Generic fantasy name | `sootstairs`, `lowgrave` |
| **Crystal Woods** | Generic fantasy name | `bellwood_copse`, future wood names |
| **Beginner Zone** | Meta name | Old Town hub, starter districts |
| **Starter Cave** | Meta name | `sootcellar`, `sootstairs` |
| **Cave 1 / Forest 1** | Numbered zones | Local names: `tinstone_cut`, `bellwood_copse` |
| **North Area** | Direction-only | `north_quarry_road`, `tinstone_cut` |
| **East Field** | Direction-only | `patchfield`, `wardenbrook` |

## Deferred to Implementation

This document defines the system. It does not define the content. The following are intentionally left for future stories and implementation work.

| Deferred Item | Why It Is Deferred |
|---------------|--------------------|
| **Actual map generation** | Region JSON and tile data for outer areas are not yet built |
| **Region JSON** | Content definitions for first and second ring areas are placeholders |
| **Creature spawns** | Spawn tables, home points, and wander ranges need area maps first |
| **Resource node placements** | Node positions need terrain data and collision maps |
| **NPC exact tiles** | NPC placements need final area layouts |
| **Quest JSON** | Area-unlock quests are named but not written |
| **Dialogue graphs** | NPC dialogue for area hints and gate interactions need quest scripts first |
| **Ferry mechanics** | Boat timing, payment, and dock collision need engine work |
| **Under-way plane system** | Multi-plane descent, lantern checks, and black market state need implementation |
| **Shortcut discovery logic** | Cartography reveal and Wayfaring unlock thresholds need playtest tuning |

## Related Documents

- `docs/spatial/outer-area-seeds.md` — Named outer areas and their future roles
- `docs/spatial/naming-atlas.md` — Naming grammar and banned patterns
- `docs/ledger/civic-ledger-system.md` — Deed tiers, permits, and ledger keepers
- `docs/skills/skill-system.md` — Skill thresholds, equipment tiers, and training methods
- `docs/world/districts-and-routes.md` — Old Town districts and starter routes
- `docs/spatial/traversal-and-chokepoints.md` — Road widths, gate widths, and flow rules
- `docs/quests/quest-system.md` — Quest requirements and tone rules

*Last updated: 2026-05-31*

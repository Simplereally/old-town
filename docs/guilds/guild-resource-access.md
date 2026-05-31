---
doc_type: authority
canonical_path: docs/guilds/guild-resource-access.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

Parent: [Guilds Index](00-index.md)

Authority references:
- `docs/guilds/guild-system.md`
- `docs/guilds/first-ring-guilds.md`
- `docs/guilds/starter-skill-hubs.md`
- `docs/areas/area-resource-progression.md`
- `docs/resources/resource-taxonomy.md`
- `docs/tools-and-intermediates/stations.md`
- `docs/skills/skill-system.md`

# Guild Resource Access

This document defines how guilds provide resource access, station quality, and resource identity. Guilds do not invent new materials. They cluster existing ones, improve the conditions under which you gather or process them, and give each location a clear reason to exist.

## Resource Cluster Principle

Guilds cluster resources so players spend less time walking. A guild does not create exclusive resources. It brings existing resources closer together. The tinstone at Foundry Hall is the same tinstone that exists at `tinstone_cut`. The difference is that Foundry Hall has four tinstone nodes within ten tiles of a furnace, while Tinstone Cut spreads its nodes across a cliff face with creatures between them.

Clustering is the primary convenience a guild offers. It reduces downtime, not drop rates. A player at a guild spends more time swinging a pick or casting a line and less time running between nodes or fighting off interruptions. This is intentional. The world still contains the best individual nodes. The guild contains the best node density.

## Station Quality

Guild stations are better than starter stations. "Better" means four things, and every first-ring guild improves at least two of them.

| Quality | Definition | Guild Example |
|---------|------------|---------------|
| **Faster** | Reduced action time per craft, smelt, or cook. | The Old Kiln House bead kiln fires hot and steady, cutting firing time by a noticeable margin compared to the Chalkhouse Court bead kiln. |
| **Cleaner** | Reduced failure rate on actions that can fail. | The Patchfield Tannery uses treated vats and proper racks, so hide-curing failures happen less often than at the district trough. |
| **Closer** | Resources are within a short walk of the station. | Foundry Hall places its tinstone nodes around the courtyard so a miner never walks more than a dozen tiles from ore face to furnace. |
| **Safer** | No creature interruptions inside the guild boundary. | Bellwood Yard sits inside a cleared copse. The trees are close, the sawpit is open, and no foxes wander the yard. |

Not every guild improves all four. Wardenbrook Fishery is closer and safer, but its cleaning tables are no faster than a dockside board. Sootstairs Rooms is faster and closer for its niche crafts, but safety depends on how quiet you are, not on a boundary flag. The mix is what gives each guild its personality.

## Resource Identity by Guild

Each guild specializes in a small set of resources. These are not exclusive. They are concentrated. A player who wants a specific material in bulk learns which guild to visit.

| Guild | Primary Resources |
|-------|-----------------|
| Foundry Hall | `tinstone`, `pig_iron_ore`, `blackcoal`, `wardenstone` |
| Bellwood Yard | `lathwood`, `bellmaple`, `bow_staves`, `feathers` |
| Patchfield Tannery | `rabbit_hide`, `fox_hide`, `sinew_cord`, `dye_plants` |
| Wardenbrook Fishery | `brook_trout`, `bell_herring`, `redback_salmon`, `river_curio` |
| Lowgrave Chapel | `grave_dust`, `bone_chips`, `faint_bead`, `grave_ash` |
| Old Kiln House | `fire_clay`, `warm_scale`, `drake_tooth`, `bellmetal_ore` |
| Sootstairs Rooms | `blackcoal_ash`, `blank_writ`, `wax_seal`, `stolen_coin_pouch` |
| Crowmile Road Camp | `oldroad_oak`, `crow_feather`, `cart_iron_scrap`, `chalk_mark` |

These lists are identity, not inventory. A guild may have a node or two outside its primary set, but the bulk of what it offers matches the table. Players learn the pattern and plan routes accordingly.

## What Guilds Do NOT Replace

The best resources in the world are still in the wild. Guilds offer convenience, not supremacy.

The `wardenstone` seam at Tinstone Cut is richer and deeper than the Foundry Hall deposit. A miner who wants volume and does not mind the walk, the climb, and the occasional crowmite should still go to the cut. The rare wild hardwoods north of Bellwood Copse are straighter and older than anything in Bellwood Yard. A fletcher who needs premium bow staves for a commission should leave the yard and head for the wild stand.

This rule is what keeps the world alive. If guilds replaced wild resources, players would never leave the safe clusters. The world would shrink to a handful of buildings. By keeping the best nodes outside, the design forces players to make real choices: safety and speed versus quality and quantity.

## Competition and Scarcity

Some guild resources are shared-world. Others are instanced per player. The distinction matters for how crowded a guild feels.

| Guild | Resource Type | Reason |
|-------|---------------|--------|
| Foundry Hall | Shared-world | Ore faces are physical. If one player mines a node, another waits for respawn. |
| Bellwood Yard | Shared-world | Trees are physical. A felled tree is gone until regrowth. |
| Patchfield Tannery | Instanced | Hide curing happens inside vats. Each player uses their own slot. |
| Wardenbrook Fishery | Mixed | Fish pools are shared, but cleaning tables are instanced. |
| Lowgrave Chapel | Instanced | Rite circles and ash collection are per-player states. |
| Old Kiln House | Shared-world | The furnace and clay pits are communal. |
| Sootstairs Rooms | Instanced | Writs and seals are crafted at private benches. |
| Crowmile Road Camp | Shared-world | Oak stands and scrap piles are physical and competitive. |

Shared-world nodes create natural traffic limits. A guild with shared ore or wood can only support so many players at once. This is desirable. It spreads the population across the world and keeps wild spots relevant even for guild-friendly materials.

## Deferred to Implementation

The following details are intentionally left for implementation stories. This document defines the design authority. The exact numbers belong to engine and content work.

| Deferred Item | Why It Is Deferred |
|---------------|--------------------|
| Exact node placement and count | Needs world editor and final interior maps |
| Respawn timers for shared nodes | Needs tick loop tuning and playtest feedback |
| Station interaction logic and scripts | Needs engine action system and station definitions |
| Exact failure-rate reduction values | Needs production-skill balancing pass |
| Exact action-time reduction values | Needs tick granularity and animation timing |
| Instancing boundary rules | Needs server ECS and player-state implementation |
| Guild boundary flags for safety | Needs area system and creature spawn exclusion logic |
| Resource node density comparisons vs wild spots | Needs final wild node placement in first-ring areas |

---

*Last updated: 2026-05-31*

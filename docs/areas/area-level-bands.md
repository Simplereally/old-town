---
doc_type: authority
canonical_path: docs/areas/area-level-bands.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/skills/skill-system.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/second-ring-areas.md`
- `docs/areas/area-progression-system.md`
- `docs/spatial/safe-danger-gradient.md`
- `docs/spatial/spawn-density-and-pressure.md`

# Area Level Bands

Old Town does not have zone levels. It has local skill thresholds, local danger, and local reward. A player with 50 Mining can walk into the deep seam at Tinstone Cut and mine wardenstone, but if their combat skills are low they will struggle with the goblin clusters that guard it. A player with 40 Favour can cleanse shrines in Lowgrave, but without the Magic level to hit Grave Wisps they will spend more time running than fighting.

Level bands are not gates. They are recommendations that describe what a player can expect to find, what skills they will need, and how dangerous the creatures and environment are. The band is a warning, not a lock. Every area in Old Town is open to every player who can reach it. The question is whether they can survive it.

---

## What This Document Decides

**Player fantasy.** This document supports the fantasy of growing into a place rather than outleveling it. Players feel their power through local mastery. A player who knows Crowmile Road knows where the goblin clusters are, where the broken carts spawn, and where the crows scatter. That knowledge matters more than a global number.

**Systems connected.** Skills, combat, danger gradient, spawn density, area progression, equipment tiers, Civic Ledger deeds, Favour rites, and Wayfaring routes.

**What it creates.** This document creates the level band classification system and the danger classification system. It maps existing areas to combat level recommendations, primary and secondary skill thresholds, and danger classes. It does not create new items, NPCs, or resources.

**Starter, midgame, and endgame.** Starter is the Hub and Safe first-ring areas where players train skills to 20 and learn the world. Midgame is Caution and Danger first-ring areas where players push skills to 50 and face their first real threats. Endgame is Peril second-ring areas where skills climb toward 99 and survival requires group play, advanced gear, or deep local knowledge.

**Player shorthand.** "safe", "caution", "danger", "peril", "the 20s", "the 50s", "the 90s".

**Banned concepts.** Zone levels, region tiers, world levels, level scaling, dynamic difficulty, level sync. These are banned because they imply a global difficulty scale that does not exist in Old Town. Danger is local, not global.

**Deferred to implementation.** Exact XP rates per resource node, precise danger gradient calculations between adjacent areas, combat level bracket adjustments for PvP, and PvP zone level restrictions.

**Existing docs that must link to it.** `docs/skills/skill-system.md`, `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, `docs/spatial/safe-danger-gradient.md`, `docs/spatial/spawn-density-and-pressure.md`.

---

## Level Band Philosophy

Old Town rejects the idea that a single number defines where a player belongs. There is no "level 30 zone." There is Tinstone Cut, where a level 1 miner can chip tinstone at the surface and a level 35 miner can claim wardenstone at the quarry face. Both players are in the same area. Both are in the right place for their skill level.

Level bands are expressed as ranges, not points. Crowmile Road is 1-15, not "level 10." The range acknowledges that players enter at different skill levels and leave at different times. A player who rushes combat might walk the full road at level 5. A player who trains crafting first might not need to fight the goblins at all.

Combat level is a rough guide, not a requirement. The combat level formula from `docs/skills/skill-system.md` produces a number that helps players compare themselves to an area's creatures. It does not unlock the area. A combat level 20 player can enter Lowgrave. Whether they should is a question of their Guard, Vitality, Arms, and Magic levels, not their combat level alone.

Skill thresholds are local and specific. Tinstone Cut cares about Mining. Wardenbrook cares about Fishing. Lowgrave cares about Favour and Magic. No area asks for "total level" or "average skill." Each area asks for the skills that matter in that place.

---

## Hub Level Band

**Area:** Old Town
**ID:** `old_town`
**Combat level recommendation:** 1 to 15
**Primary skill range:** 1 to 20
**Danger classification:** Safe

The thirteen districts of Old Town are the starter space. Market Bell, Counting House, Foundry Row, Lath Yard, Patch Lane, Chalkhouse Court, River Stoop, Oldroad Gate, Shrine Hearth, Gravegate, Sootcellar, Warden Steps, and North Quarry Road. No district core has hostile spawns. Edge districts like Gravegate and Sootcellar have sparse or light creature density at their boundaries, but the centres are safe civic and safe craft space.

Players train all 25 skills here to level 20. The Hub is where players learn the economy, meet the NPCs who will send them outward, and acquire their first equipment tiers: Cobbled, Pennywrought, and early Pig Iron. The Hub is not a tutorial zone. It is a living town that remains relevant at every stage of the game because its NPCs, shops, and services anchor the economy.

---

## First-Ring Level Bands

The first ring is the eight named areas immediately outside the 96 x 96 starter region. Each area connects to a specific district and extends that district's skill loop into the wild. The level bands here range from 1 to 50, with most areas spanning a wide range that accommodates both fresh starters and midgame players.

| Area | ID | Combat Level Rec | Primary Skill Threshold | Secondary Skill Threshold | Danger Class | Gate Type |
|------|-----|------------------|-------------------------|---------------------------|--------------|-----------|
| Crowmile Road | crowmile_road | 1-15 | Wayfaring 1 | Arms 10 | Caution | Walk |
| Bellwood Copse | bellwood_copse | 5-25 | Woodcutting 5 | Trapping 10 | Caution | Walk |
| Tinstone Cut | tinstone_cut | 1-35 | Mining 1 | Smithing 5 | Caution | Walk and climb |
| Patchfield | patchfield | 1-20 | Trapping 1 | Gardening 5 | Safe | Walk |
| Wardenbrook | wardenbrook | 5-30 | Fishing 5 | Wayfaring 10 | Caution | Walk and wade |
| Lowgrave | lowgrave | 10-40 | Favour 10 | Magic 15 | Danger | Walk |
| The Old Kiln | old_kiln | 15-50 | Smithing 15 | Hearthcraft 20 | Danger | Walk |
| Sootstairs | sootstairs | 10-45 | Sleight 10 | Wayfaring 20 | Danger | Under-way |

**Crowmile Road** is the first wild walk. The near end is Safe. The far end, near Crowmile Fork, needs combat level 10 to handle goblin clusters. Wayfaring matters because the road itself is the content.

**Bellwood Copse** starts at Woodcutting 5 for lathwood and rises to Woodcutting 15 for bellmaple. Bell Bats are manageable from combat level 10 but come in pairs at the copse heart. Trapping 10 unlocks bog foxes at the wood margin.

**Tinstone Cut** is the widest band in the first ring. Surface tinstone is available from Mining 1. Pig Iron Ore needs Mining 5. The deep wardenstone seam needs Mining 35 and faces medium goblin density. The quarry face climb needs Wayfaring 10.

**Patchfield** is the safest first-ring area. Rabbit trapping starts at Trapping 1. Fox trapping needs Trapping 10. The far hedge, where wolf signs appear, is a level 20 tease with no actual wolf spawn yet. Gardening 5 unlocks early dye plants in the field margins.

**Wardenbrook** graduates Fishing from Ditch Shrimp to Brook Trout at level 5 and Redback Salmon at level 20. The ford crossing is a Wayfaring 10 check. Wardenry patrol route contracts need Wardenry 15.

**Lowgrave** is the first Danger area. Grave Mites swarm at Favour 20. Grave Wisps need Magic 15 to hit effectively. The deepest crypt tease needs Favour 40. Group crypt entry is the first multiplayer combat content in the wild.

**The Old Kiln** is where Smithing becomes serious. Fire clay gathering starts at Smithing 15. The Kiln Fire station needs Hearthcraft 20. The Ash Drake Whelp is a combat level 25 challenge. Bellmetal smelting needs Smithing 15. The deepest pit tease needs Smithing 50.

**Sootstairs** is the under-town descent. The upper stairs are accessible from combat level 10. Blacksealed Cutpurses need combat level 20 to fight reliably. Marn Lock's hidden stall needs Sleight 25. The deepest tunnels tease level 45 content.

---

## Second-Ring Level Bands

The second ring is the horizon beyond the first wild walks. These seven areas are not yet built. They exist as names on road signs, rumours in NPC dialogue, and clues in ledger trails. The level bands here range from 20 to 99, with most areas requiring midgame skills to enter and endgame skills to master.

| Area | ID | Combat Level Rec | Primary Skill Threshold | Secondary Skill Threshold | Danger Class | Gate Type |
|------|-----|------------------|-------------------------|---------------------------|--------------|-----------|
| Crownheart Forest | crownheart_forest | 45-99 | Woodcutting 45 | Wardenry 50 | Peril | Warden contract |
| Blackbar Cut | blackbar_cut | 25-50 | Mining 25 | Guard 30 | Peril | Permit gate |
| Grave Underways | grave_underways | 20-65 | Favour 20 | Wayfaring 20 | Peril | Under-way gate |
| Witchwood Verge | witchwood_verge | 45-75 | Woodcutting 45 | Favour 45 | Danger | Favour rite |
| Moth Ferry Crossing | moth_ferry_crossing | 30-70 | Wayfaring 30 | Cartography 30 | Caution | Ferry requirement |
| Carmine Yard | carmine_yard | 45-75 | Tailoring 45 | Arms 50 | Danger | Deed tier |
| Argent Chapel Road | argent_chapel_road | 40-80 | Favour 40 | Carpentry 40 | Caution | Favour rite + deed tier |

**Crownheart Forest** is the deep wood beyond Bellwood Copse. It hosts crownheart trees at Woodcutting 90 and is the first dungeon tease. The Greenwold equipment tier anchors here. Wolves and bears patrol the deep paths. Entry requires a Warden contract to thin the wolf packs.

**Blackbar Cut** is the deep quarry beyond Tinstone Cut. It hosts blackcoal and graveiron ore, feeding the Blackbar and Graveiron equipment tiers. The entrance is a locked gate that needs a Chartered-tier quarry permit from the Civic Ledger. This is the first area where group combat is expected. Armour-break creature mechanics appear here.

**Grave Underways** is the crypt network below Lowgrave. It is the first multi-level under space. Descent needs a soot lantern and Wayfaring 20. Deeper levels need higher Favour rites to ward against rot. Gravebound gear materials drop here, feeding the Graveiron and Blueglass tiers.

**Witchwood Verge** is the haunted edge beyond Bellwood Copse. It hosts witchwood trees at Woodcutting 75 and magic herb clusters at Gardening 70. A Favour rite wards against the wood's curse. Cursed beasts and witch familiars patrol the verge.

**Moth Ferry Crossing** is the river crossing beyond Wardenbrook. It is the first ferry mechanic. Players restore the ferry through a quest, then pay a tinfin fee per crossing. Wayfaring 30 reduces wait time and unlocks shortcuts. Cartography 30 reveals new region maps after the crossing. The danger is low because the content is travel and discovery, not combat.

**Carmine Yard** is the red-dyed tannery district beyond Patchfield. It is the first PvP-adjacent space, with duels and pit fights that have stakes. Advanced tailoring trains here with dye mechanics. The Carmine Steel equipment tier is craftable here. Entry needs a Stamped Patch Lane deed.

**Argent Chapel Road** is the shrine road beyond Shrine Hearth. Players cleanse shrines along the road, each requiring higher Favour. The final chapel is a Carpentry project. The Argent equipment tier is blessable here. Entry needs a Stamped Shrine Hearth deed and a Favour rite.

---

## XP Scaling Curve

XP rates increase with danger, not with a global zone level. A Safe area gives base XP. A Caution area gives roughly 25 percent more. A Danger area gives roughly 60 percent more. A Peril area gives roughly 120 percent more. The curve is exponential, not linear, because the risk is also exponential.

| Danger Class | XP Multiplier | Feel | Example |
|--------------|---------------|------|---------|
| Safe | 1.0x | Base training, no pressure | Old Town districts, Patchfield rabbit trapping |
| Caution | 1.25x | Light pressure, optional engagement | Crowmile Road, Bellwood Copse, Wardenbrook |
| Danger | 1.6x | Active combat, route planning required | Lowgrave, The Old Kiln, Sootstairs, Witchwood Verge |
| Peril | 2.2x | Overwhelming if engaged fully, group play efficient | Crownheart Forest, Blackbar Cut, Grave Underways |

The multiplier applies to the base XP of the resource or creature in that area. A tinstone node in the Safe surface of Tinstone Cut gives base Mining XP. A wardenstone node in the Caution-to-Danger deep seam gives 1.6x Mining XP because the goblin density and competitive pressure make the node harder to hold.

Within a single area, deeper or harder nodes give more XP than surface nodes. In Tinstone Cut, tinstone is 1.0x, pig iron is 1.15x, and wardenstone is 1.6x. In Lowgrave, grave dust from edge mites is 1.0x, faint beads from wisps are 1.4x, and crypt ash from deep crypts is 1.6x.

The curve is designed to tempt players to push deeper, not to force them. A player can train to 99 in Safe and Caution areas. It will take longer, but it is possible. The XP multiplier is a reward for risk, not a requirement for progress.

---

## Risk/Reward Curve

Higher danger means higher XP, better resources, and access to higher equipment tiers. The relationship is exponential because the risk is more than just creature damage. It includes resource competition, death and recovery time, supply costs, and the opportunity cost of failing.

| Danger Class | Risk | Reward | Equipment Tier Access |
|--------------|------|--------|------------------------|
| Safe | Minimal. No hostile spawns or sparse passive creatures. | Base resources, starter gear materials | Cobbled, Pennywrought, Pig Iron |
| Caution | Light. Defensive or passive creatures. Player chooses engagement. | Better resources, early midgame materials | Pig Iron, Bellmetal, early Blackbar |
| Danger | Active. Hostile spawns, medium density, requires attention. | Advanced resources, midgame materials | Blackbar, Wardensteel, Greenwold, Graveiron |
| Peril | Severe. Dense spawns, group pressure, armour-break mechanics, rot. | Rare resources, endgame materials | Blueglass, Carmine Steel, Argent, Crownsteel, Starfall |

The curve is not linear. A Peril area does not give twice the reward of a Danger area. It gives roughly 2.2x the XP and access to materials that cannot be found anywhere else. Crownheart logs only grow in Crownheart Forest. Graveiron ore only veins in Blackbar Cut. The reward is exclusivity as much as quantity.

Risk also includes social pressure. Wardenstone in Tinstone Cut is a competitive node. Multiple miners want it. The danger is not just goblins. It is the miner standing next to you. The XP multiplier accounts for the fact that you might not get the node at all.

The risk/reward curve is designed so that Caution areas are the sweet spot for solo efficiency. A solo player in a Caution area trains steadily, with manageable risk and reliable reward. Danger areas are more efficient but require active play, route knowledge, and supply management. Peril areas are only efficient for players who can survive consistently, which usually means group play, advanced gear, or both.

---

## Danger Classification

Old Town uses four danger classes. They are player-facing labels that describe how an area feels and what a player should prepare for. They are not difficulty settings. They are warnings.

**Safe**
No hostile spawns in the core. Edge spawns, if any, are passive or defensive. The player chooses whether to engage. Safe areas are social anchors where players relax, trade, and plan. The Hub districts and Patchfield are Safe.

**Caution**
Light hostile density. Creatures are present but manageable. A player with appropriate combat levels can walk through without fighting everything. Caution areas teach players to read danger cues: sound, lighting, ground colour, and NPC barks. Crowmile Road, Bellwood Copse, Wardenbrook, and Moth Ferry Crossing are Caution.

**Danger**
Medium hostile density. Creatures are active and require attention or route planning. A player who walks blindly will be surrounded. Danger areas teach kiting, retreat, and resource management. Lowgrave, The Old Kiln, Sootstairs, Witchwood Verge, and Carmine Yard are Danger.

**Peril**
Dense or scripted hostile spawns. Overwhelming if engaged fully. Group play is efficient. Solo play is possible only with advanced gear, deep local knowledge, or both. Peril areas are the endgame training grounds. Crownheart Forest, Blackbar Cut, and Grave Underways are Peril.

The danger class of an area is not uniform across the entire area. Tinstone Cut is Caution at the surface and Danger at the quarry face. Lowgrave is Danger at the surface and Peril at the deepest crypt tease. The classification in the master table reflects the entry danger and the predominant experience. Players learn to read the gradient as they move deeper.

---

## Player Shorthand

Players talk about level bands in local terms, not system terms.

| Shorthand | What Players Mean |
|-----------|-------------------|
| "safe" | Old Town, Patchfield, or any area with no hostile pressure |
| "caution" | Crowmile Road, Bellwood Copse, Wardenbrook, or any light-pressure area |
| "danger" | Lowgrave, The Old Kiln, Sootstairs, or any area where combat is constant |
| "peril" | Crownheart Forest, Blackbar Cut, Grave Underways, or any endgame wild area |
| "the 20s" | Skill levels in the 20-29 range, usually midgame first-ring content |
| "the 50s" | Skill levels in the 50-59 range, usually late midgame or early second-ring entry |
| "the 90s" | Skill levels in the 90-99 range, endgame second-ring mastery |
| "I can handle danger" | Player has combat level 30+ and appropriate defensive gear |
| "peril solo" | Bragging rights. Surviving a Peril area alone means advanced gear and knowledge |

Players do not say "zone level 3" or "tier 2 region." They say "the cut" or "the deep grave." The shorthand is place names and danger words, not numbers.

---

## Banned Concepts

The following concepts are banned from level band design. They sound like generic MMO systems, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| Zone levels | Implies a global difficulty scale where every area has a single level | Local skill thresholds, local danger classes |
| Region tiers | Implies a vertical gear check that gates entire regions | Deed tiers, permit gates, local standing |
| World levels | Implies a global player power scale that invalidates old content | Combat level for PvP brackets only; area access is local |
| Level scaling | Creatures scaling to player level removes the feeling of growth | Fixed creature stats, fixed spawn density |
| Dynamic difficulty | Adjusting danger based on player performance breaks readability | Fixed danger classes, readable danger markers |
| Level sync | Forcing high-level players down to a zone level removes mastery | No level sync; high-level players can walk anywhere |
| Numbered zones | Meta design language that strips places of identity | Named areas: crowmile_road, bellwood_copse, blackbar_cut |
| Beginner zone / endgame zone | Meta names that collapse local identity into global tiers | Old Town hub, first ring, second ring, future rings |

---

## Deferred to Implementation

The following work is explicitly deferred. This document defines the authority for level bands and danger classes. It does not define exact numbers, spawn tables, or buildable content.

| Deferred Item | Reason | Likely Epic |
|---------------|--------|-------------|
| Exact XP rates per resource node | Needs node system implementation and playtest tuning | E09 or later |
| Precise danger gradient calculations between adjacent areas | Needs spawn system and combat system integration | E09 or later |
| Combat level bracket adjustments for PvP | Needs PvP system design authority | E11 or later |
| PvP zone level restrictions | Needs duel and wager system implementation | E11 or later |
| Danger class transition logic within multi-band areas | Needs area map layout and spawn density tuning | E10 or later |
| XP multiplier calibration by playtest | Needs live player data and feedback | Post-launch |
| Competitive node pressure multiplier formula | Needs economy calibration and node competition system | E09 or later |
| Group combat efficiency curves in Peril areas | Needs group combat system and instancing logic | E10 or later |

---

## Related Documents

- `docs/skills/skill-system.md` — 25 skills, XP curves, combat level formula, and equipment tiers
- `docs/areas/first-ring-areas.md` — Full area authorities for Crowmile Road, Bellwood Copse, Tinstone Cut, Patchfield, Wardenbrook, Lowgrave, The Old Kiln, and Sootstairs
- `docs/areas/second-ring-areas.md` — Future area identities for Crownheart Forest, Blackbar Cut, Grave Underways, Witchwood Verge, Moth Ferry Crossing, Carmine Yard, and Argent Chapel Road
- `docs/areas/area-progression-system.md` — Ring structure, unlock conditions, gate types, and route system
- `docs/spatial/safe-danger-gradient.md` — Danger zone definitions, readable danger markers, and gradient design principles
- `docs/spatial/spawn-density-and-pressure.md` — Spawn density bands, starter area rules, and density-to-resource-tier mapping

*Last updated: 2026-05-31*

---
doc_type: authority
canonical_path: docs/areas/second-ring-areas.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/spatial/outer-area-seeds.md`
- `docs/spatial/naming-atlas.md`
- `docs/areas/area-progression-system.md`
- `docs/skills/skill-system.md`
- `docs/ledger/civic-ledger-system.md`
- `docs/favour/favour-system.md`
- `docs/creatures/creature-system.md`
- `docs/resources/woods-and-timber.md`
- `docs/resources/ores-and-stone.md`
- `docs/world/districts-and-routes.md`

# Second-Ring Areas

The second ring is the horizon beyond the first wild walks. These seven areas are not yet built. They exist now as names on road signs, rumours in NPC dialogue, and clues in ledger trails. Players hear about them long before they can walk there.

This document is lighter than a first-ring area authority. It does not place tiles or write spawn tables. It answers one question for each area: what will this place be when it is built, and how do players learn its name before they see its ground?

## Seeding Philosophy

Second-ring areas are revealed through six seeding techniques defined in `docs/spatial/outer-area-seeds.md`.

| Technique | What It Does | Why It Works |
|-----------|--------------|--------------|
| Road sign | A signpost at a first-ring edge points to a road that continues | Players see the name before they can walk it |
| NPC dialogue | An NPC mentions the place in conversation | Players hear the name in context, with emotion attached |
| Ledger trail | A clue scroll step references the outer area | Players learn the name while solving something else |
| Smoke silhouette | A visible effect on the horizon | Players see something is there, and ask what it is |
| Blocked path | A physical barrier with a reason | Players know the place exists, but cannot enter yet |
| Ferry absence | A missing boat with a note | Players know travel is possible, but not yet available |

The rule for second-ring seeding: every mention must earn its place. If an NPC mentions Crownheart Forest, it must be because that NPC has a reason to care about deep wood, not because a designer needed a name drop.

## Crownheart Forest

Crownheart Forest is the deep wood beyond Bellwood Copse. Where Bellwood is a copse you can walk across in a minute, Crownheart is a forest you get lost in. It supports the fantasy of becoming a master woodcutter, the person who brings home wood that carpenters and bowyers fight over.

When built, this area will host `crownheart` trees, the tier 11 wood that requires 90 Woodcutting. It will also be the first dungeon tease, a hollow thicket or root-cave that hints at multi-level under spaces without fully building them. The Greenwold identity, nature-aligned gear and woodland contracts, will anchor here.

| Question | Answer |
|----------|--------|
| Player fantasy | Master woodcutter, deep forest explorer, nature-aligned gear seeker |
| Systems | Woodcutting, Bowcraft, Carpentry, Wardenry contracts, Cartography |
| Creates | `crownheart_log`, `crownheart_resin`, `ancient_bark`, Greenwold gear tier nodes, wolf and bear spawns, a forest warden NPC |
| Starter / midgame / endgame | Midgame access (45+ Woodcutting to enter), endgame trees (90+ Woodcutting), endgame dungeon tease |
| Player shorthand | "crownheart", "the deep wood" |
| Banned | "Dark Forest", "Elder Woods", "Enchanted Forest", "Forest of Shadows", numbered zones |
| Deferred | Map layout, exact tree positions, dungeon geometry, spawn tables, quest scripts, NPC dialogue graphs |
| Links to | `docs/resources/woods-and-timber.md`, `docs/skills/skill-system.md`, `docs/spatial/outer-area-seeds.md` |

## Blackbar Cut

Blackbar Cut is the deep quarry beyond Tinstone Cut. Where Tinstone is a surface scrape with goblins, Blackbar is a barred shaft with things that break armour. It supports the fantasy of dangerous mining, the player who descends into the dark and brings back ore that smiths make into Blackbar gear.

When built, this area will host `blackcoal` and `graveiron_ore` nodes, the tier 4 and 7 ores that feed the Blackbar and Graveiron equipment tiers. The entrance will be a locked gate that requires a quarry permit or a Chartered-tier deed from the Civic Ledger. This will be the first area where group combat makes sense, where a single player cannot clear the shaft alone.

| Question | Answer |
|----------|--------|
| Player fantasy | Dangerous miner, deep delver, group combat pioneer |
| Systems | Mining, Smithing, Guard, Wardenry, Civic Ledger deeds |
| Creates | `blackcoal`, `graveiron_ore`, `blackbar_permit`, armour-break creature mechanics, gate guard NPC, deep quarry lantern stations |
| Starter / midgame / endgame | Midgame access (25+ Mining, Blackbar tier), endgame ore (50+ Mining, Graveiron tier), group combat at all levels |
| Player shorthand | "blackbar", "the deep cut" |
| Banned | "Deep Mine", "Dark Quarry", "Iron Depths", "The Mines", numbered shafts |
| Deferred | Map layout, exact node positions, creature spawn tables, armour-break mechanic implementation, gate lock logic, group combat scaling |
| Links to | `docs/resources/ores-and-stone.md`, `docs/ledger/civic-ledger-system.md`, `docs/skills/skill-system.md` |

## Grave Underways

Grave Underways is the crypt network below Lowgrave. Where Lowgrave is a surface graveyard with rot and bone drops, the Underways are a multi-level descent with tighter corridors, harder undead, and richer Gravebound gear. It supports the fantasy of the crypt delver, the player who knows the dead better than the living.

When built, this area will be the first multi-level under space in Old Town. Players will descend from Lowgrave through a stair gate that needs a `soot_lantern` and reasonable Wayfaring. The deeper levels will require higher Favour rites to ward against rot, and will drop materials for `graveiron` and `blueglass` tier Gravebound equipment.

| Question | Answer |
|----------|--------|
| Player fantasy | Crypt delver, undead hunter, Gravebound gear collector |
| Systems | Favour, Wardenry, Guard, Vitality, Wayfaring, Cartography |
| Creates | Multi-level under-way plane, `soot_lantern` requirement, rot ward mechanics, Gravebound gear materials, deeper undead spawns, crypt keeper NPC |
| Starter / midgame / endgame | Midgame access (20+ Wayfaring, Stamped Gravegate deed), midgame depths (40+ Favour), endgame crypts (65+ Favour, Blueglass tier) |
| Player shorthand | "the underways", "deep grave" |
| Banned | "Crypt Dungeon", "Undead Depths", "Tomb Levels", "The Catacombs", numbered floors |
| Deferred | Map layout per level, plane transition mechanics, undead spawn tables, rot ward implementation, Gravebound gear recipes, crypt keeper dialogue |
| Links to | `docs/favour/favour-system.md`, `docs/areas/area-progression-system.md`, `docs/skills/skill-system.md` |

## Witchwood Verge

Witchwood Verge is the haunted edge of the forest beyond Bellwood Copse. Where Bellwood is ordinary trees with wolves, the Verge is magic timber, strange trails, and the sense that the wood is watching. It supports the fantasy of the magic resource gatherer, the player who harvests materials that beadworkers and mages need.

When built, this area will host `witchwood` trees, the tier 8 magical timber that requires 75 Woodcutting. It will also be the first place where beadwork materials grow wild, where magic herbs and fungi spawn in clusters rather than single nodes. A witch NPC will live here, or at least her hut will, offering strange trades and cryptic dialogue.

| Question | Answer |
|----------|--------|
| Player fantasy | Magic timber harvester, witchwood seeker, strange trade negotiator |
| Systems | Woodcutting, Beadwork, Gardening, Magic, Favour |
| Creates | `witchwood_log`, `witchwood_sap`, magic herb clusters, witch hut, witch NPC, curse ward mechanic, strange trail markers |
| Starter / midgame / endgame | Midgame access (45+ Woodcutting, Favour rite to ward curse), endgame timber (75+ Woodcutting), endgame magic herbs (70+ Gardening) |
| Player shorthand | "witchwood", "the verge" |
| Banned | "Magic Forest", "Enchanted Woods", "Witch Forest", "Haunted Thicket", "Crystal Grove" |
| Deferred | Map layout, exact witchwood positions, herb cluster logic, witch NPC dialogue, curse ward mechanic, hut interior |
| Links to | `docs/resources/woods-and-timber.md`, `docs/resources/herbs-roots-and-fungi.md`, `docs/favour/favour-system.md` |

## Moth Ferry Crossing

Moth Ferry Crossing is the river crossing beyond Wardenbrook. Where Wardenbrook is a shallow ford you can wade across, the Crossing is a proper ferry route that opens access to an entirely new region. It supports the fantasy of the traveller, the player who pays the ferryman and steps onto a boat that carries them somewhere they have never been.

When built, this area will be the first ferry mechanic in Old Town. Players will need to complete a quest to restore the ferry, then pay a `tinfin` fee per crossing. Wayfaring will reduce the wait time and unlock ferry shortcuts. Cartography will reveal new region maps only after the crossing is made. The moth in the name comes from the lantern moths that swarm the dock at dusk.

| Question | Answer |
|----------|--------|
| Player fantasy | River traveller, region pioneer, ferry negotiator |
| Systems | Wayfaring, Cartography, Fishing, Cooking, quest system |
| Creates | Ferry dock, ferryman NPC, `tinfin` fee mechanic, moth lantern effect, new region access gate, river fish nodes |
| Starter / midgame / endgame | Midgame access (quest completion, 30+ Wayfaring), midgame shortcuts (50+ Wayfaring), endgame region maps (70+ Cartography) |
| Player shorthand | "moth ferry", "the crossing" |
| Banned | "River Port", "Ferry Dock", "Boat Crossing", "The River", "East Bank" |
| Deferred | Map layout, ferry boat model, ferry timing mechanics, quest script, new region definition, exact fish nodes, moth particle effect |
| Links to | `docs/areas/area-progression-system.md`, `docs/skills/skill-system.md`, `docs/world/districts-and-routes.md` |

## Carmine Yard

Carmine Yard is the red-dyed tannery district beyond Patchfield. Where Patch Lane is a single tanning frame and a few hides, the Yard is a whole district of dye vats, leather workers, and duelists who test their gear in pit fights. It supports the fantasy of the risk-taker, the player who dyes their armour crimson and steps into a pit where something might break.

When built, this area will be the first PvP-adjacent space in Old Town. Not open PvP, but duels with stakes, where players can wager items or coin on pit fights. Advanced tailoring will train here, with dye mechanics that require `carmine` pigments and `bloodwood` tannins. The Carmine Steel equipment tier, tier 9 at 75 level, will be craftable here.

| Question | Answer |
|----------|--------|
| Player fantasy | Risk-taker, duelist, advanced tailor, dye master |
| Systems | Tailoring, Handicraft, Guard, Arms, Might, civic wagering |
| Creates | Dye vats, pit fight arena, duelist NPCs, `carmine_pigment`, `bloodwood_tannin`, Carmine Steel gear recipes, wager mechanic |
| Starter / midgame / endgame | Midgame access (45+ Tailoring, Stamped Patch Lane deed), midgame duels (60+ combat level), endgame gear (75+ Tailoring, Carmine Steel tier) |
| Player shorthand | "carmine", "the yard", "the pits" |
| Banned | "Duel Arena", "PvP Zone", "Fight Pit", "Red District", "Crimson Yard" |
| Deferred | Map layout, pit fight mechanics, wager system, duelist NPC dialogue, dye recipe balance, Carmine Steel recipe JSON, arena collision |
| Links to | `docs/skills/skill-system.md`, `docs/ledger/civic-ledger-system.md`, `docs/world/districts-and-routes.md` |

## Argent Chapel Road

Argent Chapel Road is the shrine road beyond Shrine Hearth. Where Shrine Hearth is a single hearth with Sister Writ, the Road is a procession of shrines, chapels, and blessing stations that lead to the first chapel building. It supports the fantasy of the devoted, the player who walks the road, cleanses the shrines, and earns the right to build a chapel of their own.

When built, this area will be the first place where Favour progression moves beyond boons and into building. Players will cleanse shrines along the road, each requiring a higher Favour level and a specific offering. The final chapel will be a Carpentry project, built with `silverbark` planks and `argent` fittings. The Argent equipment tier, tier 10 at 85 level, will be blessable here.

| Question | Answer |
|----------|--------|
| Player fantasy | Devoted pilgrim, shrine cleanser, chapel builder, Argent blessing seeker |
| Systems | Favour, Carpentry, Hearthcraft, Handicraft, Guard |
| Creates | Road shrines, chapel building site, cleanse mechanics, `silverbark_plank`, `argent_fitting`, Argent blessing ritual, pilgrim NPC |
| Starter / midgame / endgame | Midgame access (40+ Favour, Stamped Shrine Hearth deed), midgame shrines (60+ Favour), endgame chapel (80+ Favour, 70+ Carpentry) |
| Player shorthand | "argent road", "the chapel road", "the shrines" |
| Banned | "Holy Road", "Blessed Path", "Temple Row", "Shrine District", "Divine Way" |
| Deferred | Map layout, shrine positions, cleanse mechanic implementation, chapel building logic, Argent blessing formula, pilgrim NPC dialogue, `silverbark` plank recipe |
| Links to | `docs/favour/favour-system.md`, `docs/skills/skill-system.md`, `docs/ledger/civic-ledger-system.md` |

## Second-Ring Summary Table

| Area | Direction From Hub | First-Ring Lead-In | Future Level Band | Future Resources | Future Creatures | Gate Type |
|------|-------------------|--------------------|--------------------|--------------------|--------------------|-----------|
| Crownheart Forest | North-west | Bellwood Copse | 45-99 Woodcutting | `crownheart_log`, `crownheart_resin` | Wolves, bears, forest wardens | Warden contract |
| Blackbar Cut | North | Tinstone Cut | 25-50 Mining | `blackcoal`, `graveiron_ore` | Goblins, deep crawlers, gate guards | Permit gate |
| Grave Underways | South-east | Lowgrave | 20-65 Favour | Gravebound materials, `soot_lantern` | Undead, rot wraiths, crypt keepers | Under-way gate |
| Witchwood Verge | North-west | Bellwood Copse | 45-75 Woodcutting | `witchwood_log`, magic herbs | Cursed beasts, witch familiars | Favour rite |
| Moth Ferry Crossing | East | Wardenbrook | 30-70 Wayfaring | River fish, ferry access | Lantern moths, river creatures | Ferry requirement |
| Carmine Yard | South | Patchfield | 45-75 Tailoring | `carmine_pigment`, `bloodwood_tannin` | Duelists, pit beasts, tanners | Deed tier |
| Argent Chapel Road | East | Shrine Hearth | 40-80 Favour | `silverbark_plank`, `argent_fitting` | Pilgrims, shrine guardians, cleansed spirits | Favour rite + deed tier |

## Seeding Techniques Table

| Area | Primary Technique | Secondary Technique | What Players See or Hear |
|------|-------------------|---------------------|--------------------------|
| Crownheart Forest | Road sign | NPC dialogue | Sign at Bellwood edge: "Crownheart Forest. No patrol beyond this point." Letha Lath mentions crownheart bows she cannot yet make. |
| Blackbar Cut | Blocked path | Road sign | Gate at Tinstone Cut face: "Barred by order of the Warden." Sign: "Blackbar Cut. Chartered permit required." |
| Grave Underways | Under-way gate | NPC dialogue | Lowgrave stairwell with lantern check. Sister Writ mentions "the deeper dead" in Favour training. |
| Witchwood Verge | Smoke silhouette | Ledger trail | Blue glow visible from Bellwood Edge on clear nights. Oldroad Trail step: "Where the wood watches back." |
| Moth Ferry Crossing | Ferry absence | NPC dialogue | Dock with note: "Ferry departs at dawn. Return tomorrow." Edda Tinfin mentions the crossing in fishing chat. |
| Carmine Yard | Road sign | NPC dialogue | Sign at Patchfield Hedge: "Carmine Yard. Dyers and duelists." Nell Patch mentions red dye she cannot yet source. |
| Argent Chapel Road | Road sign | Ledger trail | Sign at Shrine Hearth: "Argent Chapel Road. Walk with offering." Finch Quill trail step references "the silver shrines." |

## Banned Concepts for Second Ring

The following concepts are banned from second-ring design. They sound like generic fantasy or generic MMO systems, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| "Dark Forest" | Generic fantasy | `crownheart_forest`, `witchwood_verge` |
| "Deep Mine" | Generic fantasy | `blackbar_cut` |
| "Crypt Dungeon" | Generic fantasy | `grave_underways` |
| "Magic Forest" | Generic fantasy | `witchwood_verge` |
| "River Port" | Generic fantasy | `moth_ferry_crossing` |
| "Duel Arena" | Generic MMO | `carmine_yard` |
| "Holy Road" | Generic fantasy | `argent_chapel_road` |
| "Zone levels" | Global difficulty scale | Local skill thresholds, local gate types |
| "Region tiers" | Vertical gear check | Deed tiers, permit gates, local standing |
| "Expansion packs" | Meta commercial language | Rings, future areas, post-launch content |
| "DLC areas" | Meta commercial language | Future rings, unnamed spaces |
| "World levels" | Global player power scale | Combat level for PvP only; area access is local |
| Numbered zones | Game design language | Local names: `blackbar_cut`, `witchwood_verge` |
| Direction-only names | Too vague | `crownheart_forest`, `argent_chapel_road` |

## Deferred to Implementation

This document defines identity and direction. It does not define buildable content. The following are intentionally left for future stories and implementation work.

| Deferred Item | Why It Is Deferred |
|---------------|--------------------|
| Region JSON for all seven areas | No terrain data exists yet; maps are not built |
| Tile-level map layouts | Area boundaries and ground types need world-editor work |
| Resource node placements | Node positions need terrain data and collision maps |
| Creature spawn tables | Spawn tables need area maps and home points first |
| NPC exact tiles and dialogue graphs | NPC placements need final layouts; dialogue needs quest scripts |
| Quest scripts for area unlocks | Quests are named but not written |
| Gate mechanic implementation | Permit checks, ferry timing, under-way plane transitions need engine work |
| Ferry boat model and dock collision | Art and collision need asset pipeline |
| Dye mechanic and pit fight system | PvP-adjacent systems need design authority first |
| Chapel building logic | Carpentry building system needs implementation |
| Armour-break creature mechanic | Combat system extension needs combat authority review |
| Curse ward and rot ward mechanics | Favour system extension needs favour authority review |
| Multi-level under-way plane system | Plane system needs spatial authority review |

## Related Documents

- `docs/spatial/outer-area-seeds.md`. First and second ring expansion areas with future roles
- `docs/spatial/naming-atlas.md`. Naming grammar and banned patterns
- `docs/areas/area-progression-system.md`. Ring structure, unlock conditions, and gate types
- `docs/skills/skill-system.md`. Skill thresholds, equipment tiers, and training methods
- `docs/ledger/civic-ledger-system.md`. Deed tiers, permits, and ledger keepers
- `docs/favour/favour-system.md`. Favour boons, rites, and shrine mechanics
- `docs/creatures/creature-system.md`. Creature definitions and spawn rules
- `docs/resources/woods-and-timber.md`. Wood ladder and tree definitions
- `docs/resources/ores-and-stone.md`. Ore ladder and mineral definitions
- `docs/world/districts-and-routes.md`. Old Town districts and starter routes

*Last updated: 2026-05-31*

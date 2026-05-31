---
doc_type: authority
canonical_path: docs/areas/first-ring-areas.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/spatial/outer-area-seeds.md`
- `docs/spatial/naming-atlas.md`
- `docs/world/districts-and-routes.md`
- `docs/world/starter-economy-loops.md`
- `docs/skills/skill-system.md`
- `docs/creatures/starter-creatures.md`
- `docs/resources/resource-taxonomy.md`
- `docs/favour/favour-system.md`
- `docs/quests/quest-system.md`
- `docs/ledger/oldroad-trails.md`
- `docs/map/old-town-starter-region.md`

# First-Ring Areas

The first ring is the eight named spaces immediately outside the 96 x 96 starter region. Each area is visible from an edge district or reachable by a short road extension. Players should know these names by the end of their first week. Together they form the outer boundary of the starter experience and the entry point to midgame training.

These areas are not the starter region itself. They are the first step beyond it. Every first-ring area connects back to a specific Old Town district and extends that district's skill loop into the wild.

---

## Crowmile Road

**Area ID:** `crowmile_road`
**Direction from Old Town:** West, beyond Oldroad Gate
**Gate type:** Walk — follow the cart tracks past the gate arch

Crowmile Road is the first wild road. It extends the Oldroad Trail past the gate and into open country. The road is rutted, lined with crow perches, and marked by broken cart wheels. This is where players learn that the world does not end at the district boundary.

**Player fantasy.** The road supports the fantasy of being a traveler rather than a townbound beginner. Players walk further than they have before, see crows scatter at their approach, and feel the shift from cobble to dirt underfoot. It is the first time the map feels bigger than the screen.

**Systems connected.** Wayfaring, Cartography, Arms, Guard, Vitality, Trapping. Crowmile Road is the first place where Wayfaring matters because the road itself is the content. Cartography surveys here unlock the first map extension. Combat skills matter because the crows and bandits are the first creatures that do not politely stay inside a district box.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| oldroad_oak | fallen logs | 2 | starter woodcutting |
| crow_feather | road crow drops | 1 | arrow fletching, trapping |
| cart_iron_scrap | broken wheels | 2 | smithing salvage |
| chalk_mark | survey points | 1 | cartography trail steps |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| road_crow | low ranged nuisance | scatters, returns, drops feathers |
| stray_dog | pursuit threat | chases players who run, flees when struck |
| mud_goblin | first humanoid road threat | crude cudgel, low guard |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Finch Quill | road scribe | sells blank maps, buys trail scraps, teaches cartography survey |
| Broken Cart | static object | lootable for scrap, marks the road midpoint |

**Level band.** 1 to 15. Starter players can walk the first stretch safely. The far end, near Crowmile Fork, needs combat levels around 10 to handle goblin clusters.

**Starter, midgame, and endgame.** Starter is walking the road and looting the first broken cart. Midgame is surveying the full length, fighting goblin clusters, and completing Chalk Trails found in crow nests. Endgame is Crowmile Fork as a Cartography landmark and a source of Writ Trail steps.

**Player shorthand.** "Crowmile" or "the road."

**Banned for this area.** Dark Forest, Goblin Camp, Highwaymen, Caravan Escort quest, random encounter tables, procedurally generated road events. The road is a fixed place, not a generic travel zone.

**Deferred to implementation.** Full Crowmile Fork split geometry, Finch Quill dialogue tree, crow nest loot tables, exact goblin cluster spawn points, road width and collision tiles.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/ledger/oldroad-trails.md`, `docs/world/districts-and-routes.md`, `docs/skills/skill-system.md` (Wayfaring and Cartography sections).

---

## Bellwood Copse

**Area ID:** `bellwood_copse`
**Direction from Old Town:** North-west, beyond Lath Yard and Chalkhouse Court
**Gate type:** Walk — follow the path past the bell tower stump

Bellwood Copse is a small wood named for the Market Bell that once rang from a tree here. It is the first place where woodcutting expands beyond Oldroad Oak. The copse is dense, shadowed, and home to bats, forageable plants, and the first hint that wolves live beyond the treeline.

**Player fantasy.** This area supports the fantasy of working a real wood rather than harvesting street trees. Players hear bats in the canopy, find mushrooms at the roots, and see the edge of the deeper forest beyond. It is the first gathering space that feels like nature rather than a district amenity.

**Systems connected.** Woodcutting, Bowcraft, Gardening, Trapping, Ranged, Arms. The copse is where Lathwood and Bellmaple first appear, expanding the bowcraft chain. Gardening finds early herbs and fungi here. Trapping catches Bell Bats for sinew and wing hide.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| lathwood | lathwood tree | 3 | bowcraft upgrade from oldroad_oak |
| bellmaple | bellmaple tree | 4 | balanced hardwood |
| bell_fang | bell bat drop | 2 | beadwork and handicraft material |
| warden_herb | forest floor patch | 5 | midgame gardening, apothecary input |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| bell_bat | canopy ranged threat | drops bell_fang, avoids ground melee |
| stray_dog | edge scavenger | patrols the wood margin |
| bog_fox | ground trap target | fox hide, sinew cord source |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Letha Lath | woodwarden | no permanent presence here, but her contracts send players to the copse |
| Forage Pile | static object | random herb or mushroom spawn, no owner |

**Level band.** 5 to 25. Early woodcutting starts at level 5 for lathwood. The deeper bellmaple trees need level 15. Bell Bats are manageable from level 10 but come in pairs at the copse heart.

**Starter, midgame, and endgame.** Starter is cutting lathwood and trapping the edge foxes. Midgame is bellmaple harvesting, bat wing collection for Tailoring, and finding bark marks that are Oldroad Trail steps. Endgame is the copse as a Gardening landmark and a source of Witchwood Verge teases at the far boundary.

**Player shorthand.** "Bellwood" or "the copse."

**Banned for this area.** Dark Forest, Enchanted Grove, Treant, Druid Circle, Forest Spirit, generic wolf pack combat. The wolf is a silhouette and a sound, not a spawn.

**Deferred to implementation.** Full tree placement and chop cycle, bark mark trail step logic, wolf silhouette event trigger, exact forage spawn tables, canopy height and collision.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/resources/resource-taxonomy.md` (woods-and-timber.md), `docs/creatures/starter-creatures.md`, `docs/world/starter-economy-loops.md` (Full Lath loop).

---

## Tinstone Cut

**Area ID:** `tinstone_cut`
**Direction from Old Town:** North, beyond North Quarry Road
**Gate type:** Walk and climb — the quarry path continues past the last goblin spawn

Tinstone Cut is the quarry extension. Where North Quarry Road ends at Pig Iron seams, the Cut opens into a deeper excavation with tinstone outcrops, iron veins, and more goblins. A short climb leads to the first cliff face, hinting at vertical exploration to come.

**Player fantasy.** This area supports the fantasy of working a real mine. The goblins here are not random pests. They are squatters who have claimed the deeper tunnels. Players feel the shift from surface scratching to real extraction. The climb teases that the world has layers.

**Systems connected.** Mining, Smithing, Arms, Might, Guard, Wayfaring. Tinstone Cut is where Mining graduates from Penny Copper to Tinstone and Pig Iron Ore. Smithing uses the better ore for Pennywrought and early Bellmetal. Wayfaring handles the first climb check.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| tinstone | tinstone outcrop | 1 | alloy partner to penny_copper |
| pig_iron_ore | iron vein | 2 | first significant smithing ore |
| blackcoal | coal seam | 4 | smelting fuel |
| wardenstone | deep vein | 5 | midgame ore, first competitive node |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| mud_goblin | tunnel squatter | crude cudgel, drops pig_iron_scrap |
| mudhook_grib | goblin shaman | magic-weak, drops bead clay |
| soot_rat | deep tunnel pest | disease hint, drops soot_fur |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Osric Penny | forge master | contracts players to bring tinstone and iron |
| Quarry Face | static object | climb point, marks the cut boundary |

**Level band.** 1 to 35. Surface tinstone is available from level 1. Pig Iron Ore needs level 5. The deeper wardenstone seam is level 35 and competitive. Goblin clusters scale from solo spawns near the entrance to groups of three at the quarry face.

**Starter, midgame, and endgame.** Starter is mining tinstone and fighting the first goblin past the road. Midgame is Pig Iron extraction, goblin group combat, and finding sealed stones that contain trail clues. Endgame is the wardenstone seam as a competitive node and the quarry face as a Wayfaring climb landmark.

**Player shorthand.** "The Cut" or "Tinstone."

**Banned for this area.** Goblin Camp, Orc Mine, Dungeon Entrance, Crystal Cavern, automatic mining carts, ore respawn timers shown as UI numbers. The mine is a place, not a minigame.

**Deferred to implementation.** Full tunnel geometry, climb tile validation, goblin spawn density by depth, sealed stone trail step logic, exact ore node placement and respawn timing.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/resources/resource-taxonomy.md` (ores-and-stone.md), `docs/world/starter-economy-loops.md` (Full Penny loop), `docs/skills/skill-system.md` (Mining and Smithing).

---

## Patchfield

**Area ID:** `patchfield`
**Direction from Old Town:** South, beyond Patch Lane
**Gate type:** Walk — follow the hedge past the tanning frames

Patchfield is the field beyond Patch Lane. It is flat, open, and bounded by hedgerows. Foxes run the traplines, rabbits burrow the edges, and the soil is thick enough that future farming will take root here. For now it is trapping country.

**Player fantasy.** This area supports the fantasy of working the land. Players set traps along hedgerows, check them on a loop, and bring hides back to Nell Patch. The field feels like an extension of the tailor's workshop rather than a separate biome.

**Systems connected.** Trapping, Tailoring, Gardening, Cooking, Ranged. Patchfield is where trapping expands from rabbits to foxes and eventually to wolf teases at the far hedge. Tailoring consumes the hides. Gardening finds early dye plants and herbs in the field margins.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| rabbit_hide | trapline | 1 | starter tailoring |
| fox_hide | bog_fox trap | 3 | soft leather, midgame tailoring |
| sinew_cord | fox and bat drops | 2 | bowcraft and tailoring input |
| warden_herb | field margin patch | 5 | gardening, apothecary |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| bog_fox | primary trap target | fox_hide, sinew_cord, fox_tooth |
| stray_dog | field edge scavenger | hide_scrap, small_bone |
| road_crow | hedge scavenger | bellfeathers, crow_beak |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Nell Patch | tailor master | no permanent field presence, but her contracts send players here |
| Trapline Post | static object | marks trapping node boundaries |

**Level band.** 1 to 20. Rabbit trapping starts at level 1. Fox trapping needs level 10. The far hedge, where wolf signs appear, is a level 20 tease with no actual wolf spawn yet.

**Starter, midgame, and endgame.** Starter is rabbit trapping and checking the near hedgerows. Midgame is fox trapping, sinew collection, and finding field margin herbs for Apothecary. Endgame is the field as a Gardening landmark and the hedge boundary as a creature pen tease for future farming content.

**Player shorthand.** "The Patch" or "the field."

**Banned for this area.** Farmville mechanics, crop timers with UI countdowns, automated harvesting, Farmhand NPC, generic pastureland, cow and sheep spawns. Farming is a future system, not a present minigame.

**Deferred to implementation.** Full trapline node placement, fox pathing and trap interaction, field margin herb spawn logic, hedge boundary collision, future farming tile preparation.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/world/starter-economy-loops.md` (Full Patch loop), `docs/resources/resource-taxonomy.md` (hides-bones-and-trophies.md), `docs/creatures/starter-creatures.md`.

---

## Wardenbrook

**Area ID:** `wardenbrook`
**Direction from Old Town:** East, beyond River Stoop
**Gate type:** Walk and wade — shallow ford, no ferry needed yet

Wardenbrook is the stream and ford beyond River Stoop. It is where fishing expands from ditch shrimp and tinfin to brook trout and river curios. The brook is shallow enough to wade, and the far bank has patrol routes that hint at Wardenry expansion. A broken bridge suggests future construction.

**Player fantasy.** This area supports the fantasy of working a river rather than a town dock. Players wade into the water, cast further than the stoop allows, and feel the current. The broken bridge is a promise that the world will change.

**Systems connected.** Fishing, Cooking, Wayfaring, Wardenry, Cartography. Wardenbrook is where Fishing graduates from Ditch Shrimp to Brook Trout. Cooking uses the better fish for midgame food. Wayfaring handles the ford crossing. Wardenry patrol routes appear as static NPC walks that teach the contract system.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| brook_trout | river cast | 4 | first river fish, cooking input |
| bell_herring | deeper cast | 3 | common market fish |
| river_curio | oddity pull | 2 | random material or trail source |
| redback_salmon | far bank cast | 6 | midgame river fish |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| river_snapper | bank ambush | snapper_meat, shell_chip |
| road_crow | scavenger | bellfeathers, crow_beak |
| stray_dog | far bank patrol | hide_scrap, small_bone |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Warden Holt | patrol master | no permanent brook presence, but patrol routes reference his contracts |
| Broken Bridge | static object | marks the ford boundary, teases future bridge building |
| Ferry Post | static object | note reads "Ferry departs at dawn. Return tomorrow." |

**Level band.** 5 to 30. Brook Trout needs level 5 Fishing. The far bank Redback Salmon needs level 20. The ford crossing is a Wayfaring level 10 check. Patrol route contracts need Wardenry level 15.

**Starter, midgame, and endgame.** Starter is wading the ford and catching Brook Trout. Midgame is far bank fishing, finding river curios that contain trail clues, and following patrol routes for Warden contracts. Endgame is the broken bridge as a Carpentry landmark and the ferry post as a Moth Ferry Crossing tease.

**Player shorthand.** "The Brook" or "Wardenbrook."

**Banned for this area.** Ocean fishing, boat minigame, pirate cove, mermaid, generic river village, automated fish collection. The brook is a stream, not a seaport.

**Deferred to implementation.** Full water tile depth and ford crossing logic, fish spawn tables by bank, patrol route NPC walk cycles, broken bridge interaction, ferry post note content, exact node placement.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/world/starter-economy-loops.md` (Food and Survival loop), `docs/resources/resource-taxonomy.md` (fish-and-cooking.md), `docs/creatures/starter-creatures.md`, `docs/skills/skill-system.md` (Fishing and Wayfaring).

---

## Lowgrave

**Area ID:** `lowgrave`
**Direction from Old Town:** South-east, beyond Gravegate
**Gate type:** Walk — through the iron gate and down the low path

Lowgrave is the grave expansion beyond Gravegate. Where Gravegate has edge crypts and surface mites, Lowgrave opens into group crypts, deeper rot, and the first Favour rites that require more than a candle. Grave Wisps float between the stones, and the air carries a pressure that warns players they are entering danger territory.

**Player fantasy.** This area supports the fantasy of descending into the dead's territory. Players light candles, place offerings, and feel the rot pressure as a physical presence. The group crypts are the first multiplayer content where players stand together against wisp swarms.

**Systems connected.** Favour, Guard, Vitality, Magic, Arms, Might, Wardenry. Lowgrave is where Favour graduates from simple shrine offerings to grave rites. Combat skills matter because Grave Wisps are magic-resistant and Grave Mites come in groups. Wardenry contracts send players here for crypt cleansing.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| grave_dust | grave_mite drop | 1 | apothecary, favour offerings |
| bone_chips | grave_mite drop | 2 | beadwork, favour cheap XP |
| faint_bead | grave_wisp drop | 3 | beadwork, magic input |
| grave_ash | grave_wisp drop | 4 | hearthcraft, apothecary |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| grave_mite | swarm pest | group spawn, drops grave_dust and bone_chips |
| grave_wisp | magic-resistant floater | faint_bead, grave_ash, resistant to melee |
| cellar_rat | crypt edge scavenger | rat_tail, small_bones |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Sister Writ | shrine keeper | no permanent Lowgrave presence, but her rites send players here |
| Crypt Entrance | static object | group instance trigger, rot pressure source |
| Offering Stone | static object | Favour rite location, consumes grave_flowers and candles |

**Level band.** 10 to 40. Grave Mites are manageable solo at level 10 but swarm at level 20. Grave Wisps need Magic level 15 to hit effectively. Favour rites at the Offering Stone need level 20. The deepest crypt tease needs level 40.

**Starter, midgame, and endgame.** Starter is edge crypt cleansing and solo mite combat. Midgame is group crypt entry, wisp swarm combat, and Favour rite completion for boon unlocks. Endgame is the crypt network as a Grave Underways tease and the Offering Stone as a high-tier Favour training spot.

**Player shorthand.** "Lowgrave" or "the graves."

**Banned for this area.** Necromancer boss, Skeleton Army, Zombie Horde, Dark Lord, resurrection mechanic, undead faction, generic haunted graveyard. The dead are a pressure, not an army.

**Deferred to implementation.** Full crypt geometry and group instance logic, rot pressure system implementation, wisp swarm spawn rules, Offering Stone rite interaction, grave flower spawn logic, exact spawn density.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/favour/favour-system.md`, `docs/creatures/starter-creatures.md`, `docs/world/starter-economy-loops.md` (Warden Contract and Gravegate Flowers loops), `docs/quests/quest-system.md` (Gravegate Flowers quest).

---

## The Old Kiln

**Area ID:** `old_kiln`
**Direction from Old Town:** East, beyond Foundry Row
**Gate type:** Walk — follow the ash path past the chimney stacks

The Old Kiln is the foundry extension. Where Foundry Row has the Bellows Furnace and beginner smithing, the Kiln has the fire clay pits, the drake whelp lair, and the first advanced smithing station. Smoke from the Kiln is visible from Foundry Row on clear days, making it a silhouette landmark.

**Player fantasy.** This area supports the fantasy of working with fire. Players feel the heat, see the drake smoke, and handle fire clay that is too hot to hold without gloves. The Kiln is where smithing becomes serious.

**Systems connected.** Smithing, Hearthcraft, Beadwork, Arms, Guard, Vitality. The Old Kiln is where Smithing graduates from Pennywrought to Bellmetal and beyond. Hearthcraft manages the kiln fires. Beadwork uses fire clay for bead blanks. Combat skills matter because the Ash Drake Whelp guards the deepest pit.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| fire_clay | clay pit | 3 | beadwork, hearthcraft |
| warm_scale | ash_drake_whelp drop | 5 | tailoring, handicraft |
| drake_tooth | ash_drake_whelp drop | 5 | beadwork, magic foci |
| bellmetal_ore | kiln seam | 3 | smithing alloy |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| ash_drake_whelp | kiln guardian | warm_scale, drake_tooth, fire-breath tease |
| soot_rat | tunnel pest | soot_fur, blackcoal_ash |
| cellar_rat | edge scavenger | rat_tail, small_bones |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Pippa Hearth | hearth keeper | no permanent Kiln presence, but her contracts send players for fire clay |
| Kiln Fire | static object | advanced smithing station, requires hearthcraft to maintain |
| Drake Pit | static object | whelp spawn anchor, marks the Kiln boundary |

**Level band.** 15 to 50. Fire clay gathering starts at level 15 Smithing. The Kiln Fire station needs level 20 Hearthcraft. The Ash Drake Whelp is a level 25 combat challenge. Bellmetal smelting needs level 15. The deepest pit tease needs level 50.

**Starter, midgame, and endgame.** Starter is fire clay gathering at the near pits and fighting soot rats. Midgame is Bellmetal smelting at the Kiln Fire, Ash Drake Whelp combat for scales, and finding drake smoke as a Cartography landmark. Endgame is the Kiln as an advanced smithing hub and the Ash Flats beyond as a future fire magic tease.

**Player shorthand.** "The Kiln" or "Kiln."

**Banned for this area.** Dragon Cave, Dragon Boss, Dragon Slayer quest, lava dungeon, fire elemental, magma forge, legendary weapon forge. The drake is a whelp, not a dragon. The Kiln is a workshop, not a raid.

**Deferred to implementation.** Full kiln geometry and fire tile logic, Kiln Fire station interaction, drake whelp spawn and leash rules, fire clay node placement, ash path collision, smoke silhouette visibility system.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/world/starter-economy-loops.md` (Full Penny loop), `docs/skills/skill-system.md` (Smithing and Hearthcraft), `docs/creatures/starter-creatures.md`, `docs/resources/resource-taxonomy.md` (ores-and-stone.md, bead-materials.md).

---

## Sootstairs

**Area ID:** `sootstairs`
**Direction from Old Town:** Down, beneath Sootcellar
**Gate type:** Under-way — descend the soot-stained stairs past the rat nests

Sootstairs is the under-town beneath Sootcellar. Where the cellar has rats and cutpurse hints, the stairs open into deeper tunnels, blacksealed territory, and the first Sleight hub. The air is thick, the light is scarce, and the market above feels very far away.

**Player fantasy.** This area supports the fantasy of slipping beneath the world. Players descend past the legitimate cellar into the spaces where the town's rules do not reach. It is the first place where Sleight feels like a real skill rather than a district gimmick.

**Systems connected.** Sleight, Wayfaring, Arms, Guard, Vitality, Favour. Sootstairs is where Sleight expands from pickpocketing to locks, traps, and hidden stalls. Wayfaring handles the under-way navigation. Combat skills matter because Blacksealed Cutpurses patrol the deeper tunnels. Favour is needed for cleansing shrines that hold back the rot from below.

**Key resources.**

| Resource | Source | Tier | Role |
|----------|--------|------|------|
| blackcoal_ash | soot deposits | 2 | hearthcraft, apothecary |
| blank_writ | cutpurse drop | 3 | favour, ledger input |
| wax_seal | cutpurse drop | 3 | handicraft, quest item |
| stolen_coin_pouch | cutpurse drop | 2 | currency, reclaimable at Counting House |

**Key creatures.**

| Creature | Role | Combat Identity |
|----------|------|-----------------|
| blacksealed_cutpurse | tunnel patrol | blank_writ, wax_seal, stolen_coin_pouch |
| soot_rat | deep pest | soot_fur, blackcoal_ash |
| cellar_rat | stair edge scavenger | rat_tail, small_bones |

**Key NPCs and services.**

| NPC | Role | Service |
|-----|------|---------|
| Marn Lock | black market broker | hidden stall, buys writs and seals, sells lockpicks |
| Hidden Shrine | static object | Favour cleanse point, consumes candles |
| Soot Stair | static object | descent point, marks the under-way boundary |

**Level band.** 10 to 45. The upper stairs are accessible from level 10 with basic combat. Blacksealed Cutpurses need level 20 to fight reliably. Marn Lock's stall needs level 25 Sleight to access. The deepest tunnels tease level 45 content.

**Starter, midgame, and endgame.** Starter is descending the stairs, fighting soot rats, and finding the first hidden shrine. Midgame is Blacksealed Cutpurse combat, lockpicking practice, and trading writs with Marn Lock. Endgame is the deepest tunnel as a Sootstairs Deep tease and the hidden market as a future economy hub.

**Player shorthand.** "The Stairs" or "Sootstairs."

**Banned for this area.** Thieves Guild, Assassin's Creed, sewer level, rat king boss, underground city, generic dark market. The black market is a stall and a whisper, not a guild hall.

**Deferred to implementation.** Full tunnel geometry and under-way collision, light scarcity system, Marn Lock shop logic and hidden stall trigger, lockpicking minigame, Blacksealed Cutpurse patrol routes, hidden shrine interaction, exact spawn density.

**Existing docs that must link to it.** `docs/spatial/outer-area-seeds.md`, `docs/world/districts-and-routes.md` (Sootcellar district), `docs/creatures/starter-creatures.md`, `docs/skills/skill-system.md` (Sleight and Wayfaring), `docs/favour/favour-system.md`, `docs/quests/quest-system.md` (The Missing Bell-Clapper quest).

---

## First-Ring Summary Table

| Area | ID | Direction | Role | Level Band | Gate Type | Shorthand |
|------|-----|-----------|------|------------|-----------|-----------|
| Crowmile Road | crowmile_road | West | travel and combat road | 1-15 | Walk | Crowmile |
| Bellwood Copse | bellwood_copse | North-west | woodcutting and bowcraft | 5-25 | Walk | Bellwood |
| Tinstone Cut | tinstone_cut | North | mining and quarry | 1-35 | Walk and climb | The Cut |
| Patchfield | patchfield | South | trapping and hides | 1-20 | Walk | The Patch |
| Wardenbrook | wardenbrook | East | fishing and ford | 5-30 | Walk and wade | The Brook |
| Lowgrave | lowgrave | South-east | graves and Favour rites | 10-40 | Walk | Lowgrave |
| The Old Kiln | old_kiln | East | smithing and fire craft | 15-50 | Walk | The Kiln |
| Sootstairs | sootstairs | Down | under-town and Sleight | 10-45 | Under-way | The Stairs |

---

## Banned Concepts for First Ring

The following concepts are banned from all first-ring areas. They sound like generic fantasy or game design, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| Dark Forest | Generic fantasy wood | Bellwood Copse, Witchwood Verge |
| Goblin Camp | Generic fantasy encampment | Tinstone Cut, Mud Goblin tunnels |
| Dragon Cave | Generic fantasy lair | The Old Kiln, Ash Drake Whelp pit |
| Skeleton Army | Generic undead horde | Lowgrave, Grave Mite swarms |
| Thieves Guild | Generic criminal faction | Sootstairs, Blacksealed Cutpurse patrols |
| Pirate Cove | Generic coastal threat | Wardenbrook, River Snapper banks |
| Farmville mechanics | Generic farming minigame | Patchfield, trapping and future farming tease |
| Caravan Escort | generic travel quest | Crowmile Road, broken cart looting |
| Random encounter tables | Generic procedural content | Fixed spawn points and trail steps |
| Dungeon Entrance | Generic instanced content | Crypt Entrance, group crypt instance |
| Legendary Weapon Forge | Generic endgame smithing | Kiln Fire, advanced smelting station |
| Numbered zones | Meta design language | Named places with cultural identity |

---

## Deferred to Implementation

The following work is explicitly deferred. First-ring areas are authority documents, not implementation specs. Maps, spawns, dialogue, quests, and shops will be built in later stories.

| Deferred Item | Reason | Likely Epic |
|---------------|--------|-------------|
| Full region geometry and tile maps | Needs world-editor tooling and region expansion epics | E10 or later |
| Exact creature spawn points and density | Needs spawn system implementation and playtest | E09 or later |
| NPC dialogue trees for field NPCs | Needs dialogue system and content JSON pipeline | E08 or later |
| Quest scripts for first-ring areas | Needs quest system implementation | E08 or later |
| Shop stock and service pricing | Needs economy calibration and shop system | E07 or later |
| Trail step placement and logic | Needs Oldroad Trails system implementation | E09 or later |
| Resource node respawn timing | Needs node system and competition tuning | E09 or later |
| Under-way and climb collision | Needs spatial system extensions | E10 or later |
| Group crypt instance logic | Needs instancing system | E10 or later |
| Light scarcity in Sootstairs | Needs rendering and atmosphere system | E10 or later |
| Smoke silhouette visibility | Needs visual effect system | E10 or later |
| Ferry and bridge building teases | Needs construction system | E11 or later |
| Farming system in Patchfield | Needs full farming design and implementation | E12 or later |
| Wolf spawn in Bellwood Copse | Needs creature expansion beyond starter set | E10 or later |
| Blacksealed faction depth | Needs faction system design | E11 or later |

---

## Related Documents

- `docs/spatial/outer-area-seeds.md` — First and second ring expansion area seeds
- `docs/spatial/naming-atlas.md` — Cultural naming grammar and banned patterns
- `docs/world/districts-and-routes.md` — Old Town district layout and starter routes
- `docs/world/starter-economy-loops.md` — First 30-minute playable loops
- `docs/skills/skill-system.md` — 25 skills, XP curves, and equip requirements
- `docs/creatures/starter-creatures.md` — Starter creature roster and drop tables
- `docs/resources/resource-taxonomy.md` — Canonical resource names and tier ladder
- `docs/favour/favour-system.md` — Favour terms, boons, and shrine rules
- `docs/quests/quest-system.md` — Quest rules and dialogue tone
- `docs/ledger/oldroad-trails.md` — Trail tiers, sources, and step types
- `docs/map/old-town-starter-region.md` — 96 x 96 starter region overview

*Last updated: 2026-05-31*

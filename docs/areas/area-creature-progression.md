---
doc_type: authority
canonical_path: docs/areas/area-creature-progression.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/creatures/creature-system.md`
- `docs/creatures/starter-creatures.md`
- `docs/creatures/combat-roles.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/second-ring-areas.md`
- `docs/spatial/monster-movement-and-leashing.md`
- `docs/spatial/spawn-density-and-pressure.md`
- `docs/spatial/safe-danger-gradient.md`
- `docs/creatures/wardenry-contracts.md`

# Area Creature Progression

Creature progression is the art of teaching combat through encounter design. Each area introduces new creatures that teach specific combat lessons, not just bigger numbers. A player who walks from Old Town to the first ring and beyond should feel the world getting wilder, not just grindier.

## Design Standards

### What player fantasy does this support?

The fantasy of becoming competent in a dangerous world. Players start by killing rats in a cellar and end by reading patrol routes, predicting ambushes, and choosing whether to fight or flee. Creature progression supports the fantasy of growing from townbound beginner to capable traveller.

### What systems does it connect to?

Combat skills (Arms, Might, Guard, Vitality), Wardenry contracts, Favour rites, Trapping, Cartography surveys, drop tables, and the safe-danger gradient. Every creature is a lesson that connects to a skill or a system.

### What items, NPCs, areas, and resources does it create?

This document creates creature definitions for `mudhook_grib`, the only first-ring creature not yet defined in `docs/creatures/starter-creatures.md`. It also defines escalation patterns, spawn logic, and danger gradients for all first-ring and second-ring areas.

### What is starter, midgame, and endgame?

Starter is Old Town districts and the near edge of first-ring areas, where creatures are passive or defensive and density is light. Midgame is the full first ring, where territorial creatures, group spawns, and the first miniboss appear. Endgame is second-ring areas, where creatures require permits, rites, or contracts to face safely.

### What should players call it in shorthand?

Players talk about creature progression in creature terms, not system terms. "The rats," "the crows," "the goblins," "the drake," "the cutpurses." Area shorthand from `docs/areas/first-ring-areas.md` also applies: "Crowmile," "the Cut," "the Kiln."

### What is banned because it sounds generic or derivative?

Level scaling, dynamic difficulty, creature packs that spawn on timers, boss arenas, raid mechanics, elite creatures with glowing auras, numbered zones, global difficulty tiers, and generic fantasy names like "Dark Forest" or "Goblin Camp."

### What is deferred to implementation?

Exact spawn tables, spawn density numbers, creature AI implementation, combat stat numbers, drop table weights, and creature model specifications. This document defines identity and behaviour, not buildable content.

### What existing docs must link to it?

`docs/creatures/creature-system.md`, `docs/creatures/starter-creatures.md`, `docs/creatures/combat-roles.md`, `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, `docs/spatial/monster-movement-and-leashing.md`, `docs/spatial/spawn-density-and-pressure.md`, `docs/spatial/safe-danger-gradient.md`, and `docs/creatures/wardenry-contracts.md`.

---

## Creature Escalation Philosophy

Creatures teach through behaviour, not stats. A harder creature is one that forces the player to learn a new skill, use a different weapon, or read the environment more carefully.

| Escalation Layer | What Changes | What Stays the Same |
|------------------|--------------|---------------------|
| Old Town districts | Passive or defensive creatures, light density, safe retreat | Creature IDs, drop tables, basic combat loop |
| First ring near edge | Same creatures, slightly more dense, territorial behaviour | Same IDs, same drops, same lessons |
| First ring deep | New creatures, new behaviours, miniboss tease | Same combat system, same skill requirements |
| Second ring | New creature families, group combat, permit gates | Same teaching philosophy, same readable danger |

The escalation rule: a creature that appears in a deeper area should behave differently than its shallow cousin, even if it shares a name. A `mud_goblin` near the Tinstone Cut entrance is a solo squatter. A `mud_goblin` at the quarry face is part of a territorial cluster.

---

## Old Town Creatures

Old Town districts host the starter creature set defined in `docs/creatures/starter-creatures.md`. These creatures exist in the first ring too, but their behaviour and density change.

| Creature | Old Town Role | Old Town Behaviour |
|----------|---------------|--------------------|
| cellar_rat | safe first target | micro-wander, passive, 1-2 per room |
| soot_rat | disease hint | skulk, territorial in deeper rooms |
| stray_dog | pursuit teacher | route patrol, defensive on alley approaches |
| mud_goblin | first humanoid | local patrol, territorial near quarry face |
| bell_bat | ranged teacher | roost and return, defensive, avoids ground melee |
| bog_fox | trapping crossover | skittish flee, passive, flees toward snare points |
| grave_mite | rot pressure | slow micro-wander, territorial at crypt mounds |
| grave_wisp | magic-resistant | tethered spirit, territorial, bound to shrine boundary |
| ash_drake_whelp | miniboss tease | lair leash, miniboss, hard lair boundary |
| blacksealed_cutpurse | rogue teacher | skulk, defensive, hides in shadows |
| road_crow | low ranged nuisance | route and roost, passive, scatters and returns |
| river_snapper | edge combat | static at water edge, defensive |

---

## First-Ring Creatures

First-ring areas reuse starter creatures and add one new creature: `mudhook_grib`. Each area has a distinct creature identity that teaches a specific combat lesson.

### Crowmile Road

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| road_crow | low ranged nuisance | scatters, returns, drops feathers | passive | route and roost | fast trash |
| stray_dog | pursuit threat | chases players who run, flees when struck | defensive | route patrol | normal |
| mud_goblin | first humanoid road threat | crude cudgel, low guard | territorial | local patrol | normal |

Crowmile Road teaches travel combat. Crows are harmless unless chased. Dogs teach pursuit and retreat. Goblins teach that the road gets harder the further you walk.

### Bellwood Copse

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| bell_bat | canopy ranged threat | drops bell_fang, avoids ground melee | defensive | roost and return | normal |
| stray_dog | edge scavenger | patrols the wood margin | defensive | route patrol | normal |
| bog_fox | ground trap target | fox hide, sinew cord source | passive | skittish flee | normal |

Bellwood Copse teaches vertical combat. Bats force ranged or magic use. Foxes teach trapping patience. Dogs teach edge awareness.

### Tinstone Cut

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| mud_goblin | tunnel squatter | crude cudgel, drops pig_iron_scrap | territorial | local patrol | normal |
| mudhook_grib | goblin shaman | magic-weak, drops bead clay | territorial | local patrol | slow rare |
| soot_rat | deep tunnel pest | disease hint, drops soot_fur | territorial | skulk | fast trash |

Tinstone Cut teaches group combat and magic weakness. Goblins cluster near the quarry face. The mudhook grib is the first magic-vulnerable creature, teaching players to switch attack styles. Soot rats are fast respawning trash that fill the tunnels.

### Patchfield

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| bog_fox | primary trap target | fox_hide, sinew_cord, fox_tooth | passive | skittish flee | normal |
| stray_dog | field edge scavenger | hide_scrap, small_bone | defensive | route patrol | normal |
| road_crow | hedge scavenger | bellfeathers, crow_beak | passive | route and roost | fast trash |

Patchfield teaches patience and route planning. Foxes flee. Crows scatter. Dogs patrol the edge. The lesson is not to fight everything, but to choose your targets.

### Wardenbrook

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| river_snapper | bank ambush | snapper_meat, shell_chip | defensive | static at water edge | normal |
| road_crow | scavenger | bellfeathers, crow_beak | passive | route and roost | fast trash |
| stray_dog | far bank patrol | hide_scrap, small_bone | defensive | route patrol | normal |

Wardenbrook teaches edge combat and water awareness. Snappers are static but dangerous at the bank. Dogs patrol the far side, teaching players to watch both banks.

### Lowgrave

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| grave_mite | swarm pest | group spawn, drops grave_dust and bone_chips | territorial | slow micro-wander | normal |
| grave_wisp | magic-resistant floater | faint_bead, grave_ash, resistant to melee | territorial | tethered spirit | normal |
| cellar_rat | crypt edge scavenger | rat_tail, small_bones | passive | micro-wander | fast trash |

Lowgrave teaches group combat and magic necessity. Mites swarm. Wisps resist melee. Rats are the safe edge target that lets players retreat and recover.

### The Old Kiln

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| ash_drake_whelp | kiln guardian | warm_scale, drake_tooth, fire-breath tease | miniboss | lair leash | slow rare |
| soot_rat | tunnel pest | soot_fur, blackcoal_ash | territorial | skulk | fast trash |
| cellar_rat | edge scavenger | rat_tail, small_bones | passive | micro-wander | fast trash |

The Old Kiln teaches miniboss respect. The drake whelp is slow to respawn, hard to kill, and guards the best resource. Rats are the ambient trash that makes the kiln feel lived-in.

### Sootstairs

| Creature | Role | Combat Identity | Aggression | Movement | Respawn Rhythm |
|----------|------|-----------------|------------|----------|----------------|
| blacksealed_cutpurse | tunnel patrol | blank_writ, wax_seal, stolen_coin_pouch | defensive | skulk | slow rare |
| soot_rat | deep pest | soot_fur, blackcoal_ash | territorial | skulk | fast trash |
| cellar_rat | stair edge scavenger | rat_tail, small_bones | passive | micro-wander | fast trash |

Sootstairs teaches skulk detection and ambush awareness. Cutpurses hide in shadows and are rare. Rats are the constant tunnel presence. The lesson is to move carefully and watch for stillness.

---

## Second-Ring Creatures

Second-ring areas are not yet built. Their creature identities are named in `docs/areas/second-ring-areas.md` and exist now as rumours, road signs, and dialogue hints. When built, these creatures will teach advanced combat lessons.

| Area | Future Creatures | Combat Lesson |
|------|------------------|---------------|
| crownheart_forest | wolves, bears, forest wardens | group combat, armour break, patrol reading |
| blackbar_cut | goblins, deep crawlers, gate guards | group combat, permit gates, armour break |
| grave_underways | undead, rot wraiths, crypt keepers | multi-level descent, rot pressure, Favour wards |
| witchwood_verge | cursed beasts, witch familiars | curse mechanics, magic resistance, strange trails |
| moth_ferry_crossing | lantern moths, river creatures | ferry timing, water combat, region transition |
| carmine_yard | duelists, pit beasts, tanners | PvP-adjacent stakes, wager combat, risk reward |
| argent_chapel_road | pilgrims, shrine guardians, cleansed spirits | Favour progression, shrine cleansing, chapel building |

---

## New Creature Definitions

### mudhook_grib

The mudhook grib is the only first-ring creature not defined in `docs/creatures/starter-creatures.md`. It is a goblin shaman that squats in the deeper Tinstone Cut tunnels.

| Field | Definition |
|-------|------------|
| Creature ID | `mudhook_grib` |
| Name | Mudhook Grib |
| Region | `tinstone_cut` |
| Ecology role | Goblin shaman, squatter, bead clay source |
| Combat role | Teaches magic weakness and attack style switching |
| Aggression | territorial |
| Movement | local patrol, short wander radius near goblin clusters |
| Attack style | magic, crude earth spell |
| Weakness | magic attacks, weak to air and water spells |
| Drops | bead_clay, crude_bead, goblin_charm |
| Skill links | Beadwork, Magic |
| Wardenry contract | yes, "Gribs in the Deep Cut" |
| Trophy | no |
| Respawn rhythm | slow rare |

The grib is not a boss. It is a teaching creature that forces magic users to feel powerful and melee users to adapt. It appears near goblin clusters but does not cluster itself. One grib per tunnel depth level.

---

## Combat Roles by Area

Every creature in the first ring teaches something specific. The combat role is not a stat label. It is a lesson.

| Creature | What It Teaches | How It Teaches |
|----------|-----------------|----------------|
| road_crow | ranged combat patience | scatters when approached, returns when player stops, forces timing |
| stray_dog | movement and leashing | chases when player runs, flees when struck, teaches pursuit boundaries |
| mud_goblin | basic melee and guard | crude cudgel, low guard, teaches weapon choice and food timing |
| bell_bat | ranged and magic necessity | avoids ground melee, forces bow or spell use |
| bog_fox | trapping and skittish behaviour | flees toward snare points, teaches trap placement |
| grave_mite | group combat and status effects | slow but persistent swarm, teaches corner checking and retreat |
| grave_wisp | magic and Favour interaction | resistant to melee, weak to magic, teaches attack style switching |
| ash_drake_whelp | miniboss respect and armour break | hard lair boundary, fire-breath tease, teaches preparation and retreat |
| blacksealed_cutpurse | Sleight and anti-bandit contracts | hides in shadows, teaches skulk detection and vigilance |
| river_snapper | edge combat and static danger | static at water edge, teaches positioning and range awareness |
| mudhook_grib | magic weakness | weak to magic, strong against melee, teaches attack style adaptation |

---

## Spawn Logic and Density

### Aggression Types by Area

| Area | Passive | Defensive | Territorial | Miniboss |
|------|---------|-----------|-------------|----------|
| crowmile_road | road_crow | stray_dog | mud_goblin | none |
| bellwood_copse | bog_fox | bell_bat, stray_dog | none | none |
| tinstone_cut | none | none | mud_goblin, mudhook_grib, soot_rat | none |
| patchfield | bog_fox, road_crow | stray_dog | none | none |
| wardenbrook | road_crow | river_snapper, stray_dog | none | none |
| lowgrave | cellar_rat | none | grave_mite, grave_wisp | none |
| old_kiln | cellar_rat | soot_rat | none | ash_drake_whelp |
| sootstairs | cellar_rat | blacksealed_cutpurse | soot_rat | none |

### Leash Rules by Creature

| Creature | Leash Radius | Return Behaviour | Safe Zone Rule |
|----------|--------------|------------------|----------------|
| road_crow | 8 tiles | walk to roost | cannot enter safe districts |
| stray_dog | 12 tiles | walk to patrol route | cannot enter Market Bell or Counting House |
| mud_goblin | 10 tiles | walk to home point | cannot enter Foundry Row or Lath Yard |
| bell_bat | 6 tiles | return to roost | cannot enter Warden Steps roof safe zone |
| bog_fox | 15 tiles | flee to snare point or home | cannot enter Patch Lane tanning frame area |
| grave_mite | 8 tiles | slow walk to crypt mound | cannot enter Gravegate gate safe zone |
| grave_wisp | 6 tiles | fade and reform at tether point | cannot enter Shrine Hearth safe zone |
| ash_drake_whelp | hard lair boundary | snap to lair centre | cannot leave Old Kiln pit under any circumstances |
| blacksealed_cutpurse | 10 tiles | skulk to shadow home | cannot enter Market Bell or Counting House |
| river_snapper | 4 tiles | static reset | cannot leave water edge |
| mudhook_grib | 8 tiles | walk to patrol home | cannot enter North Quarry Road safe zone |

### Movement Types by Creature

| Creature | Movement Type | Wander Radius | Notes |
|----------|---------------|---------------|-------|
| road_crow | route and roost | 4 tiles | walks roads, roosts in trees |
| stray_dog | route patrol | 6 tiles | follows alley or road routes |
| mud_goblin | local patrol | 4 tiles | short loops near resource nodes |
| bell_bat | roost and return | 3 tiles | flies, returns to canopy roost |
| bog_fox | skittish flee | 8 tiles | flees toward snare points when threatened |
| grave_mite | slow micro-wander | 2 tiles | short shuffles near crypt mounds |
| grave_wisp | tethered spirit | 3 tiles | bound to shrine or crypt boundary |
| ash_drake_whelp | lair leash | 0 tiles | hard boundary, no wander |
| blacksealed_cutpurse | skulk | 5 tiles | hides in shadows, moves when player is distant |
| river_snapper | static | 0 tiles | does not move from water edge |
| mudhook_grib | local patrol | 3 tiles | short patrol near goblin clusters |

---

## Respawn Rhythm

Respawn rhythm is not a timer. It is a feel. Fast trash creatures make an area feel lived-in. Slow rare creatures make an area feel special.

| Rhythm | Creatures | Feel |
|--------|-----------|------|
| fast trash | cellar_rat, soot_rat, road_crow | constant ambient presence, safe to ignore, easy to farm |
| normal | stray_dog, bog_fox, mud_goblin, bell_bat, grave_mite, grave_wisp, river_snapper | regular presence, predictable, supports contract loops |
| slow rare | ash_drake_whelp, blacksealed_cutpurse, mudhook_grib | occasional presence, worth waiting for, supports trophy and rare drop loops |

The rhythm rule: a creature's respawn speed must match its reward value. Rats respawn fast because their drops are common. The drake whelp respawns slowly because its scales are valuable. The cutpurse respawns slowly because stolen coin pouches are currency.

---

## Danger Gradient

Creature danger is not just about stats. It is about emotional readability. Players should feel danger before they take damage.

### Danger Markers by Area

| Area | Visual Marker | Sound Marker | Density Marker |
|------|---------------|--------------|----------------|
| crowmile_road | broken cart wheels, crow perches | crow caws, wind | light, scattered |
| bellwood_copse | dense canopy, bat silhouettes | bat wings, branch creaks | light to medium, pairs at heart |
| tinstone_cut | tunnel darkness, goblin graffiti | goblin chatter, pickaxe echoes | medium, clusters at face |
| patchfield | open field, hedgerows | bird calls, fox rustling | light, skittish |
| wardenbrook | water edge, broken bridge | current, splash | sparse, static |
| lowgrave | crypt mounds, grave soil | wisp hum, mite skitter | sparse but scary, swarm potential |
| old_kiln | smoke, drake pit, ash path | fire crackle, drake growl | sparse ambient, scripted miniboss |
| sootstairs | soot stains, scarce light | rat squeaks, cutpurse whispers | medium ambient, rare threat |

### Emotional Danger Rules

1. Silhouettes before stats. A player should see a bat silhouette or drake smoke before they see a health bar.
2. Sound before sight. Goblin chatter and wisp hum tell players something is near before it appears on screen.
3. Density before damage. A cluster of goblins feels dangerous because of numbers, not because each goblin hits hard.
4. Retreat must be possible. Every dangerous area must have a visible retreat path. Danger is a choice, not a trap.

---

## Player Shorthand

Players do not use design language. They use creature names and area nicknames.

| Shorthand | What Players Mean |
|-----------|-------------------|
| "the rats" | cellar_rat or soot_rat, anywhere |
| "the crows" | road_crow, usually Crowmile Road or Patchfield |
| "the dogs" | stray_dog, any edge or alley |
| "the goblins" | mud_goblin, Tinstone Cut or North Quarry Road |
| "the grib" | mudhook_grib, deep Tinstone Cut |
| "the bats" | bell_bat, Bellwood Copse or Warden Steps roof |
| "the foxes" | bog_fox, Patchfield or Bellwood edge |
| "the mites" | grave_mite, Lowgrave or Gravegate |
| "the wisps" | grave_wisp, Lowgrave or Shrine Hearth edge |
| "the drake" | ash_drake_whelp, The Old Kiln |
| "the cutpurses" | blacksealed_cutpurse, Sootstairs or Market Bell alley |
| "the snappers" | river_snapper, Wardenbrook or River Stoop |
| "the road" | Crowmile Road creatures |
| "the cut" | Tinstone Cut creatures, especially goblins and gribs |
| "the copse" | Bellwood Copse creatures |
| "the graves" | Lowgrave creatures |
| "the kiln" | The Old Kiln creatures, especially the drake |
| "the stairs" | Sootstairs creatures, especially cutpurses |

---

## Banned Concepts

The following concepts are banned from creature progression design. They sound like generic MMO systems or generic fantasy, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| level scaling | removes teaching value | fixed creature behaviour, local skill thresholds |
| dynamic difficulty | undermines player learning | readable danger markers, player choice to engage |
| creature packs on timers | feels artificial, not lived-in | fixed spawn points, natural respawn rhythms |
| boss arenas | generic endgame content | miniboss lairs with hard boundaries, like ash_drake_whelp |
| raid mechanics | group content without local reason | group crypt instances, patrol routes, contract spawns |
| elite creatures with glowing auras | generic visual language | rare creatures with distinct behaviour, like mudhook_grib |
| numbered zones | meta design language | named places with cultural identity |
| global difficulty tiers | removes local identity | local creature behaviour, local resource pressure |
| "Dark Forest" | generic fantasy | bellwood_copse, witchwood_verge, crownheart_forest |
| "Goblin Camp" | generic fantasy | tinstone_cut, north_quarry_road |
| "Dragon Cave" | generic fantasy | old_kiln, kiln_ash_flats |
| "Skeleton Army" | generic fantasy | lowgrave, grave_underways |
| "Thieves Guild" | generic fantasy | sootstairs, blacksealed_cutpurse patrols |

---

## Deferred to Implementation

The following work is explicitly deferred. This document defines creature identity and behaviour, not buildable content.

| Deferred Item | Reason | Likely Epic |
|---------------|--------|-------------|
| exact spawn tables | needs area maps and home points | E09 or later |
| spawn density numbers | needs playtest tuning | E09 or later |
| creature AI implementation | needs combat system and pathfinding | E08 or later |
| combat stat numbers | needs combat calibration | E08 or later |
| drop table weights | needs economy calibration | E07 or later |
| creature model specifications | needs art pipeline | E10 or later |
| mudhook_grib dialogue or quest hook | needs quest system | E08 or later |
| second-ring creature definitions | needs second-ring area maps | E11 or later |
| group crypt instance logic | needs instancing system | E10 or later |
| armour-break mechanic for second ring | needs combat system extension | E10 or later |
| curse ward mechanic for witchwood_verge | needs Favour system extension | E11 or later |
| rot wraith behaviour for grave_underways | needs status effect system | E10 or later |

---

## Related Documents

- `docs/creatures/creature-system.md` — creature definition rules and required fields
- `docs/creatures/starter-creatures.md` — starter creature roster and drop tables
- `docs/creatures/combat-roles.md` — enemy teaching roles and design rules
- `docs/areas/first-ring-areas.md` — first-ring area identities, resources, and NPCs
- `docs/areas/second-ring-areas.md` — second-ring area seeds and future creature names
- `docs/spatial/monster-movement-and-leashing.md` — aggression types, leash rules, and movement ecology
- `docs/spatial/spawn-density-and-pressure.md` — density bands and starter area rules
- `docs/spatial/safe-danger-gradient.md` — emotional danger gradient and readable markers
- `docs/creatures/wardenry-contracts.md` — contract ladder and starter contracts

*Last updated: 2026-05-31*

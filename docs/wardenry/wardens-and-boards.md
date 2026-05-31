---
doc_type: authority
canonical_path: docs/wardenry/wardens-and-boards.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: `docs/wardenry/wardenry-system.md`, `docs/wardenry/contracts-and-task-generation.md`, `docs/wardenry/task-tables-starter.md`, `docs/wardenry/task-tables-first-ring.md`, `docs/wardenry/task-tables-second-ring.md`, `docs/wardenry/named-warrants-and-boss-tasks.md`, `docs/areas/area-progression-system.md`, `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, `docs/skills/skill-system.md`, `docs/world/npc-cast.md`

# Wardens and Boards

Wardens are the contract-giving NPCs of Old Town. Each Warden sits at a physical board in a specific area and offers contracts drawn from their personal task table. Wardens are the primary engine of daily play: they give players direction, reward marks, and gate access to harder content through level bands and area unlocks. This document lists every Warden, their board location, their contract identity, and the rules that govern when a player can access them.

## Warden Summary Table

| warden_id | display name | area | level band | task identity | board location |
| `warden_holt` | Warden Holt | Warden Steps | 1–30 | starter contracts, safe town work | Warden Steps board |
| `orven_roadcap` | Orven Roadcap | Crowmile Road Camp | 20–45 | road threats, crows, bandits | Crowmile camp board |
| `cress_lowgrave` | Cress Lowgrave | Lowgrave | 25–55 | grave creatures, rot, Favour links | Lowgrave chapel board |
| `sella_coalhand` | Sella Coalhand | Tinstone Cut | 25–55 | quarry pests, goblins, ore thieves | Tinstone quarry board |
| `pell_hookline` | Pell Hookline | Wardenbrook | 25–55 | river creatures, snappers, ferry pests | Wardenbrook dock board |
| `vey_falsewick` | Vey Falsewick | Sootstairs | 30–60 | illegal/sketchy tasks, cutpurses, doors | Sootstairs back room |
| `rook_redcord` | Rook Redcord | Carmine Yard | 50–75 | duelists, dangerous humanoids | Carmine Yard pit |
| `argent_bailiff` | Argent Bailiff | Argent Chapel Road | 65–90 | curses, cleanse tasks, high undead | Argent Chapel board |

## Warden Holt

**warden_id:** `warden_holt`

**display name:** Warden Holt

**area:** Warden Steps

**level band:** 1–30

**board location:** Warden Steps board

**task identity:** Starter contracts, safe town work. Holt is the first Warden every player meets. His contracts teach the basics of combat, movement, and proof collection without putting the player in danger.

**unlock requirement:** None. Warden Holt is available from character creation.

**personality:** Gruff but fair. Holt has been assigning contracts in Old Town longer than anyone can remember. He knows every rat in the cellars by name and treats new recruits with a mixture of impatience and reluctant protectiveness.

**example contracts:**
- Cellar Rats
- Soot Rats
- Mud Goblins
- Bell Bats
- Road Crows
- Bog Foxes
- Grave Mites
- River Snappers

**boss tasks:** Cellar King, Mudhook Grib, Ashling in the Kiln (rarely)

## Orven Roadcap

**warden_id:** `orven_roadcap`

**area:** Crowmile Road Camp

**level band:** 20–45

**task identity:** Road threats. Roadcap's contracts focus on the dangers that plague the roads around Old Town: crows, bandits, stray dogs, and anything else that makes travel unsafe.

**unlock requirement:** Crowmile Road route unlocked + combat level 20.

**personality:** Road-worn and terse. Roadcap talks to crows more than people and treats every contract as a matter of road safety rather than glory.

**example contracts:**
- road_crow
- crowpost_bandit
- stray_dog
- bell_bat
- crowpost_jack (named warrant)

## Cress Lowgrave

**warden_id:** `cress_lowgrave`

**area:** Lowgrave

**level band:** 25–55

**task identity:** Grave creatures, rot, and Favour links. Lowgrave's contracts deal with the undead and corrupted things that rise from the graves. Many of her tasks tie into the Favour system, requiring offerings or shrine visits.

**unlock requirement:** Lowgrave route unlocked + combat level 25.

**personality:** Grave-tender. Cress speaks softly and treats the dead with respect, even when she is sending players to destroy them.

**example contracts:**
- grave_mite
- grave_wisp
- wrong_flower
- gravekeeper_wrong_son (named warrant)

## Sella Coalhand

**warden_id:** `sella_coalhand`

**area:** Tinstone Cut

**level band:** 25–55

**task identity:** Quarry pests, goblins, ore thieves. Coalhand's contracts revolve around the quarry and the things that infest it: goblins, thieves, and the occasional bell that should not be there.

**unlock requirement:** Tinstone Cut route unlocked + combat level 25.

**personality:** Forge-scarred and blunt. Sella hates goblins with a personal intensity and rewards anyone who clears them from her quarry.

**example contracts:**
- mud_goblin
- quarry_goblin
- ore_thief
- mudhook_grib
- cut_bell (named warrant)

## Pell Hookline

**warden_id:** `pell_hookline`

**area:** Wardenbrook

**level band:** 25–55

**task identity:** River creatures, snappers, ferry pests. Hookline's contracts focus on the river and its dangers: eels, snappers, dock rats, and anything that threatens the ferry.

**unlock requirement:** Wardenbrook route unlocked + combat level 25.

**personality:** Fisher. Pell knows every eel in the Wardenbrook by scale pattern and treats contracts like fishing expeditions: patience, then violence.

**example contracts:**
- river_snapper
- ferry_eel
- dock_rat
- old_snapper
- ferry_eel (named warrant)

## Vey Falsewick

**warden_id:** `vey_falsewick`

**area:** Sootstairs

**level band:** 30–60

**task identity:** Illegal and sketchy tasks. Falsewick operates in the grey zone of Old Town's economy. His contracts involve cutpurses, sealed doors, and tasks that respectable Wardens pretend not to see.

**unlock requirement:** Sootstairs route unlocked + combat level 30.

**personality:** Shady and knowing. Vey knows every back door in Old Town and treats contracts as favours rather than official business.

**example contracts:**
- blacksealed_cutpurse
- cellar_rat
- soot_rat
- door_that_bites (named warrant)

## Rook Redcord

**warden_id:** `rook_redcord`

**area:** Carmine Yard

**level band:** 50–75

**task identity:** Duelists and dangerous humanoids. Redcord's contracts are for experienced fighters. He sends players against skilled humanoid opponents in the Carmine Yard pit and beyond.

**unlock requirement:** Carmine Yard route unlocked + combat level 50.

**personality:** Ruthless but respectful. Redcord cares only about skill. He despises cowardice and rewards players who face his challengers head-on.

**example contracts (seeded):**
- redcord_challenger
- carmine_duelist
- redcord_champion (named warrant)

## Argent Bailiff

**warden_id:** `argent_bailiff`

**area:** Argent Chapel Road

**level band:** 65–90

**task identity:** Curses, cleanse tasks, and high undead. The Bailiff's contracts are the hardest in Old Town. They involve cursed creatures, penitent undead, and the kind of cleansing that requires both strength and preparation.

**unlock requirement:** Argent Chapel Road route unlocked + combat level 65.

**personality:** Solemn and vigilant. The Bailiff is never unarmed and treats every contract as a sacred duty rather than a job.

**example contracts (seeded):**
- curse_carrier
- argent_penitent
- high_undead

## Warden Unlock Rules

1. Warden Holt requires no unlock. Every player has access from the moment they enter Old Town.
2. First-ring Wardens (Roadcap, Lowgrave, Coalhand, Hookline) require the corresponding area route to be unlocked plus a minimum combat level.
3. Second-ring Wardens (Falsewick, Redcord, Bailiff) require the corresponding area route to be unlocked plus a higher minimum combat level.
4. Wardens do not require quest completion to unlock. Quests may introduce Wardens narratively, but the mechanical unlock is always route + level.
5. Wardens do not require reputation. There is no reputation grind to access a Warden's board.

## Related Systems

- [Wardenry System](wardenry-system.md) — overview of marks, contracts, and chains
- [Contracts and Task Generation](contracts-and-task-generation.md) — how contracts are built and offered
- [Task Tables: Starter](task-tables-starter.md) — Holt's full contract table
- [Task Tables: First Ring](task-tables-first-ring.md) — Roadcap, Lowgrave, Coalhand, Hookline tables
- [Task Tables: Second Ring](task-tables-second-ring.md) — Falsewick, Redcord, Bailiff tables
- [Named Warrants and Boss Tasks](named-warrants-and-boss-tasks.md) — boss contract rules
- [Area Progression System](../areas/area-progression-system.md) — how routes unlock
- [First Ring Areas](../areas/first-ring-areas.md) — area details for first-ring Wardens
- [Second Ring Areas](../areas/second-ring-areas.md) — area details for second-ring Wardens
- [Skill System](../skills/skill-system.md) — skills referenced in contract requirements
- [NPC Cast](../world/npc-cast.md) — full NPC directory including Wardens

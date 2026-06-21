---
doc_type: authority
canonical_path: docs/wardenry/task-tables-starter.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: docs/wardenry/wardenry-system.md, docs/wardenry/wardens-and-boards.md, docs/wardenry/contracts-and-task-generation.md, docs/wardenry/contract-chains-and-marks.md, docs/wardenry/named-warrants-and-boss-tasks.md, docs/wardenry/notorious-variants.md, docs/creatures/starter-creatures.md, docs/creatures/wardenry-contracts.md, docs/bosses/starter-bosses.md, docs/areas/area-level-bands.md

# Starter Task Table

Warden Holt's starter contracts for combat levels 1–30.

## Warden Holt

Warden Holt stands at the Sootcellar board near the Old Town gate. He is the first Warden most players meet, and his contracts are designed to teach the contract loop without punishment. Holt's tasks are all safe, short, and local. He does not send players beyond the town walls.

## Starter Task Table

| task_id | display name | count | type | area | danger | reward identity | skills/items that help |
| celler_rat_cull | Cellar Rats | 8–15 | Cull/Proof | Sootcellar | Safe | rat tails, bones | shortblade, cudgel |
| soot_rat_cull | Soot Rats | 6–12 | Cull | Sootcellar deeper | Safe | soot fur, ash | any weapon |
| mud_goblin_posted | Mud Goblins | 6–12 | Posted/Cull | North Quarry Road | Risky | pig iron scraps | javelin, maul |
| bell_bat_cull | Bell Bats | 5–10 | Cull | Lath Yard rafters | Safe | bellfeathers | ranged, magic |
| road_crow_cull | Road Crows | 8–15 | Cull | Oldroad Gate | Safe | feathers | ranged |
| bog_fox_cull | Bog Foxes | 4–8 | Cull/Proof | Patchfield edge | Safe | hides, sinew | trap, piercing |
| grave_mite_rite | Grave Mites | 5–10 | Grave Rite | Gravegate | Safe | bone chips, grave dust | Favour, candles |
| river_snapper_cull | River Snappers | 3–6 | Cull | River Stoop | Safe | snapper meat, shells | bait, fishing |

## Starter Boss Tasks

Starter boss tasks are rare. Holt only offers them after the player completes a specific contract chain, and each boss task is a Named Warrant with a single target. These tasks are opt-in and do not block progression.

| task_id | boss | type | danger | unlock |
| cellar_king_warrant | The Cellar King | Named Warrant | Safe | Complete Rats Under Tally's |
| mudhook_grib_warrant | Mudhook Grib | Named Warrant | Risky | Complete Mud on the North Road |
| ashling_warrant | Ashling in the Kiln | Named Warrant | Risky | Complete Smoke Over Old Town |

## Task Identity by Contract

**Cellar Rats (cellar_rat_cull)**
The player descends into the Sootcellar and kills rats. Shortblades and cudgels work well in tight spaces. Rat tails and bones drop more frequently during this contract. Players repeat this task to learn the cull loop and gather cheap crafting materials.

**Soot Rats (soot_rat_cull)**
A deeper variant of cellar rats. Any weapon works. Soot fur and ash are the main drops, used in early crafting and alchemy. This task teaches players that deeper areas can hold similar creatures with different drops.

**Mud Goblins (mud_goblin_posted)**
The player travels to North Quarry Road and kills posted mud goblins. Javelins and mauls are effective. Pig iron scraps drop here and feed into early smithing. This is the first risky task Holt offers, teaching players to read danger ratings.

**Bell Bats (bell_bat_cull)**
The player climbs into the Lath Yard rafters to kill bats. Ranged weapons and magic are ideal. Bellfeathers are the primary drop, used in fletching and crafting. This task introduces vertical space and flying targets.

**Road Crows (road_crow_cull)**
The player stands at Oldroad Gate and shoots crows. Ranged weapons are required. Feathers drop in bulk and are used for fletching. This is a safe, repeatable task for ranged skill training.

**Bog Foxes (bog_fox_cull)**
The player hunts foxes at the Patchfield edge. Traps and piercing weapons help. Hides and sinew are the drops, used in leatherworking and crafting. This task introduces proof contracts, where the player must return with a specific item.

**Grave Mites (grave_mite_rite)**
The player performs a Grave Rite at Gravegate. Favour and candles are required. Bone chips and grave dust drop here, used in necromantic crafting and alchemy. This task introduces ritual contracts and the Favour system.

**River Snappers (river_snapper_cull)**
The player catches or kills snappers at River Stoop. Bait and fishing skills help. Snapper meat and shells are the drops, used in cooking and crafting. This task introduces gathering-adjacent contracts.

## Design Rules

1. Starter tasks are safe and short.
2. Starter tasks teach the contract loop.
3. Starter tasks do not require travel.
4. Starter tasks are completable in under 10 minutes.
5. Starter boss tasks are rare and opt-in.

## Related Systems

- [Wardenry System](wardenry-system.md) — overview of the Wardenry system
- [Wardens and Boards](wardens-and-boards.md) — how Wardens and their boards work
- [Contracts and Task Generation](contracts-and-task-generation.md) — how tasks are generated
- [Contract Chains and Marks](contract-chains-and-marks.md) — how chains and marks work
- [Named Warrants and Boss Tasks](named-warrants-and-boss-tasks.md) — boss task system
- [Notorious Variants](notorious-variants.md) — variant system
- [Starter Creatures](../creatures/starter-creatures.md) — creature definitions for starter tasks
- [Wardenry Contracts](../creatures/wardenry-contracts.md) — contract creature bindings
- [Starter Bosses](../bosses/starter-bosses.md) — boss definitions for starter tasks
- [Area Level Bands](../areas/area-level-bands.md) — level band definitions for areas

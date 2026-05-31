---
doc_type: authority
canonical_path: docs/bosses/first-ring-bosses.md
parent_index: docs/bosses/00-index.md
root_index: docs/00-index.md
---

Parent: [Bosses Index](00-index.md)

Authority references:
- `docs/bosses/boss-system.md`
- `docs/bosses/boss-categories.md`
- `docs/bosses/starter-bosses.md`
- `docs/bosses/boss-mechanics.md`
- `docs/bosses/unique-drops-and-trophies.md`
- `docs/bosses/boss-quest-hooks.md`
- `docs/bosses/boss-balance-rules.md`
- `docs/areas/first-ring-areas.md`
- `docs/creatures/wardenry-contracts.md`
- `docs/quests/quest-system.md`
- `docs/combat/signature-mechanics.md`

# First-Ring Bosses

This document defines the eight repeatable area bosses in first-ring areas beyond Old Town. These are designed for combat levels 20 to 40 and require travel outside the town walls. They are more rewarding than starter bosses but demand more attention, better tools, or tolerance for risk.

## Summary Table

| boss_id | display name | player shorthand | area | category | combat level band | access requirement | safe/risky/dangerous |
|---------|--------------|------------------|------|----------|-------------------|--------------------|----------------------|
| `crowpost_jack` | Crowpost Jack | "the Jack" | Crowmile Road | Area Boss | 20–30 | Crowmile Road route unlocked | Risky |
| `aunt_brackens_stump` | Aunt Bracken's Stump | "the Stump" | Bellwood Copse | Area Boss | 20–30 | Woodcutting 20 or Bellwood quest | Safe |
| `the_cut_bell` | The Cut Bell | "the Cut Bell" | Tinstone Cut | Lair Boss | 25–35 | Mining 20 + Tinstone Cut route | Dangerous |
| `hidepeg_horror` | Hidepeg Horror | "the Horror" | Patchfield | Area Boss | 20–30 | Trapping 20 or Tailoring 20 | Risky |
| `the_ferry_eel` | The Ferry Eel | "the Eel" | Wardenbrook | Area Boss | 25–35 | Fishing 20 + Wardenbrook route | Dangerous |
| `gravekeepers_wrong_son` | Gravekeeper's Wrong Son | "the Wrong Son" | Lowgrave | Duel Boss | 25–35 | Favour 20 + Gravegate Flowers | Risky |
| `kiln_worm_noll_saw` | Kiln-Worm Noll Saw | "the Worm" | The Old Kiln | Lair Boss | 30–40 | Hearthcraft 20 + Smoke Over Old Town | Dangerous |
| `the_door_that_bites` | The Door That Bites | "the Door" | Sootstairs | Lair Boss | 25–35 | Sleight 20 or Keys That Open Nothing | Risky |

---

## Crowpost Jack

**boss_id:** `crowpost_jack`

**player shorthand:** "the Jack"

**area:** Crowmile Road, near the road fork.

**category:** Area Boss

**combat level band:** 20–30

**access requirement:** Crowmile Road route unlocked.

**safe/risky/dangerous:** Risky

**fantasy:** A road bandit who has learned to call crows. He stands at the road fork, a crow on each shoulder, and demands tolls from travellers. He is not a fighter by trade; he is a trickster who uses the crows as his weapons.

**mechanics:**
- Calls crows to attack. The crows swarm the player, dealing damage over time. The player must kill the crows or they will overwhelm.
- Throws a crow-call whistle. The whistle summons more crows if the player does not interrupt it.
- Weak to ranged attacks. The crows are fast and hard to hit with melee. Ranged weapons can pick them off.
- Disappears into the crow flock. When the crows are numerous, Jack blends in and is hard to target.
- Teaches target priority and ranged combat. The player must decide whether to kill the crows or focus on Jack.

**lair:** The road fork is an open area with a broken cart and a crow post. The crows swarm from the trees, and the player must manage the adds.

**inputs:** Food (recommended), ranged weapon (recommended), area-of-effect spell or ability (optional).

**outputs:** crow_feather_bundle, crow_token, road_scrap, jack_whistle (rare), crow_caller_claw (trophy).

**drop identity:** The crow_feather_bundle feeds Tailoring. The crow_token is a local currency. The jack_whistle is a rare unique for summoning. The crow_caller_claw is a trophy.

**failure state:** The player can retreat to the Crowmile Road. Death is possible if the crows overwhelm. Lost food is the primary cost.

**what it teaches:** How to manage adds, how to use ranged weapons, and how to prioritize targets.

**what it does not replace:** Normal Wayfaring or combat training. Crowpost Jack is a named encounter, not a replacement for fighting bandits.

---

## Aunt Bracken's Stump

**boss_id:** `aunt_brackens_stump`

**player shorthand:** "the Stump"

**area:** Bellwood Copse, near the woodcutting stations.

**category:** Area Boss

**combat level band:** 20–30

**access requirement:** Woodcutting 20 or completion of the Bellwood quest.

**safe/risky/dangerous:** Safe

**fantasy:** A living stump that has absorbed the spirit of an old woodcutter. The stump has roots that move, bark that hardens, and a face that appears when it is angry. It is the first boss that connects woodcutting to combat.

**mechanics:**
- Roots grab the player. The roots slow movement and deal damage over time. The player must break free with a melee attack or a sharp weapon.
- Bark hardens periodically. When the bark is hard, the stump is immune to blunt damage. The player must switch to a sharp weapon or wait for the bark to soften.
- Throws wood chips. The stump throws chips that deal ranged damage. The player must dodge or block.
- Weak to axes. Axes deal bonus damage and break the bark faster.
- Teaches weapon switching and movement. The player must adapt to the bark phase and avoid the roots.

**lair:** The stump is in a small clearing in the Bellwood Copse. The clearing has wood chips on the ground and a woodcutting station nearby.

**inputs:** Food (recommended), an axe (recommended), a sharp weapon (optional).

**outputs:** bark_bundle, bow_stave, wood_chip_pile, stump_ring (rare), bracken_root (trophy).

**drop identity:** The bark_bundle feeds Bowcraft. The bow_stave is a crafting material. The stump_ring is a rare unique for woodcutting. The bracken_root is a trophy.

**failure state:** The player can retreat to the Bellwood Copse. No death penalty. Lost food is the only cost.

**what it teaches:** How to switch weapons against armour, how to manage movement debuffs, and how to use axes.

**what it does not replace:** Normal woodcutting or bowcraft. The stump is a combat encounter, not a gathering target.

---

## The Cut Bell

**boss_id:** `the_cut_bell`

**player shorthand:** "the Cut Bell"

**area:** Tinstone Cut, deep in the quarry.

**category:** Lair Boss

**combat level band:** 25–35

**access requirement:** Mining 20 and Tinstone Cut route unlocked.

**safe/risky/dangerous:** Dangerous

**fantasy:** A possessed quarry bell that has been cut from its mount and now rolls through the quarry, crushing anything in its path. The bell is a mining danger made manifest. It is the first lair boss that teaches hazard avoidance and tool usage.

**mechanics:**
- Rolls across the quarry floor. The bell moves in a pattern, crushing players who stand in its path. The player must move to safe tiles.
- Rings before it rolls. The bell rings a warning tone before it moves. The player must listen and move.
- Can be stopped with a pickaxe. A player with a pickaxe can jam the bell's mechanism, stopping it for a few ticks.
- Throws ore shards. The bell throws shards that deal ranged damage. The player must dodge.
- Damages tools. The bell's roll damages the player's pickaxe or mining tool. The player must repair or bring a spare.
- Teaches hazard avoidance, listening, and tool management. The player must move, listen, and manage tools.

**lair:** The Tinstone Cut quarry is a large, open area with a bell mechanism in the center. The bell rolls along tracks, and the player must navigate the tracks.

**inputs:** Food (recommended), pickaxe (required), spare tool (recommended), armour with crush resistance.

**outputs:** bell_ore_shard, quarry_token, broken_bell_clapper, bell_metal (rare), cut_bell_fragment (trophy).

**drop identity:** The bell_ore_shard is a crafting material. The quarry_token is an activity currency. The broken_bell_clapper is a quest item. The bell_metal is a rare unique for smithing. The cut_bell_fragment is a trophy.

**failure state:** The player can retreat to the Tinstone Cut surface. Death is possible if the bell crushes the player. Lost tools and food are the primary costs.

**what it teaches:** How to avoid hazards, how to listen for warnings, and how to manage tools.

**what it does not replace:** Normal mining at the Tinstone Cut. The Cut Bell is a combat encounter, not a gathering target.

---

## Hidepeg Horror

**boss_id:** `hidepeg_horror`

**player shorthand:** "the Horror"

**area:** Patchfield, near the tannery.

**category:** Area Boss

**combat level band:** 20–30

**access requirement:** Trapping 20 or Tailoring 20.

**safe/risky/dangerous:** Risky

**fantasy:** A stitched hide beast that has escaped from the Patchfield tannery. It is a creature made of leather scraps, sinew, and anger. It is the first boss that connects trapping and tailoring to combat.

**mechanics:**
- Stitched hide resists slashing. The beast's hide is made of leather, so slashing weapons deal reduced damage.
- Weak to piercing and fire. Piercing weapons and fire spells deal bonus damage.
- Throws hide scraps. The beast throws scraps that deal ranged damage and slow movement.
- Can be trapped. A player with a trap can immobilize the beast for a few ticks, allowing free attacks.
- Teaches resistance awareness and trapping. The player must switch weapons and use traps.

**lair:** The Patchfield tannery is a small building with a hide-drying rack. The beast lurks near the rack, and the player must fight in the open field.

**inputs:** Food (recommended), piercing weapon or fire spell (recommended), trap (optional but helpful).

**outputs:** hide_bundle, sinew_cord, tannery_scrap, hidepeg_nail (rare), stitched_hide (trophy).

**drop identity:** The hide_bundle feeds Tailoring. The sinew_cord is a crafting material. The hidepeg_nail is a rare unique for trapping. The stitched_hide is a trophy.

**failure state:** The player can retreat to the Patchfield. Death is possible if the beast overwhelms. Lost food is the primary cost.

**what it teaches:** How to switch weapons against resistances, how to use traps, and how to manage movement.

**what it does not replace:** Normal trapping or tailoring. The Hidepeg Horror is a combat encounter, not a gathering target.

---

## The Ferry Eel

**boss_id:** `the_ferry_eel`

**player shorthand:** "the Eel"

**area:** Wardenbrook, near the ferry dock.

**category:** Area Boss

**combat level band:** 25–35

**access requirement:** Fishing 20 and Wardenbrook route unlocked.

**safe/risky/dangerous:** Dangerous

**fantasy:** A giant eel that has claimed the Wardenbrook ferry channel. The eel is long, slippery, and electric. It is the first boss that teaches water combat and Tide bead usage.

**mechanics:**
- Swims in a pattern around the dock. The eel moves in a circle, and the player must predict its position.
- Electric surge. The eel discharges electricity, dealing damage to all players near the water.
- Can be lured with bait. The player can throw bait to draw the eel to a specific tile.
- Tide beads reduce electric damage. The player can use Tide beads to ground the electricity and reduce damage.
- Melee is risky. The eel is in the water, so melee attacks are difficult. Ranged and magic are safer.
- Teaches water combat, bait usage, and Tide bead preparation. The player must prepare and position.

**lair:** The Wardenbrook ferry channel is a narrow waterway with a dock on one side. The eel swims in the channel, and the player stands on the dock.

**inputs:** Food (recommended), bait (recommended), Tide beads (recommended), ranged or magic weapon.

**outputs:** eel_meat, eel_skin, electric_sac, ferry_eel_tooth (rare), eel_spine (trophy).

**drop identity:** The eel_meat is a cooking ingredient. The eel_skin feeds Tailoring. The electric_sac is a crafting material. The ferry_eel_tooth is a rare unique for magic. The eel_spine is a trophy.

**failure state:** The player can retreat to the Wardenbrook dock. Death is possible if the eel's electric surge hits. Lost food and bait are the primary costs.

**what it teaches:** How to fight in water, how to use Tide beads, and how to lure creatures.

**what it does not replace:** Normal fishing or the Wardenbrook Tide activity. The Ferry Eel is a combat encounter, not a skilling target.

---

## Gravekeeper's Wrong Son

**boss_id:** `gravekeepers_wrong_son`

**player shorthand:** "the Wrong Son"

**area:** Lowgrave, in the Grave Underways.

**category:** Duel Boss

**combat level band:** 25–35

**access requirement:** Favour 20 and completion of Gravegate Flowers.

**safe/risky/dangerous:** Risky

**fantasy:** The wrong son of a gravekeeper, buried in the wrong grave, now risen as a hostile spirit. The Wrong Son is a duelist who fights with a grave shovel and a lantern. He is the first boss that teaches Favour and undead combat.

**mechanics:**
- Fights with a grave shovel. The shovel has a long reach and a slow swing. The player must dodge or parry.
- Lantern light reveals weak points. The Wrong Son's lantern casts light on his body, revealing weak points that take bonus damage.
- Rot aura if not cleansed. The Wrong Son emits a rot aura that deals damage over time unless the player cleanses it with Favour or a salve.
- Weak to cleanse and fire. Cleanse spells and fire attacks deal bonus damage.
- Teaches parry, dodge, and cleanse usage. The player must manage the rot aura and exploit the weak points.

**lair:** The Grave Underways is a narrow tunnel with graves on both sides. The Wrong Son stands in the center, shovel in hand, lantern glowing.

**inputs:** Food (recommended), cleanse spell or salve (recommended), fire weapon or spell (recommended), armour with rot resistance.

**outputs:** grave_shovel, grave_lantern, wrong_son_bone, wrong_son_ring (rare), gravekeeper_proof (trophy).

**drop identity:** The grave_shovel is a weapon. The grave_lantern is a light source. The wrong_son_ring is a rare unique for Favour. The gravekeeper_proof is a trophy.

**failure state:** The player can retreat to the Lowgrave Chapel. Death is possible if the rot aura is too strong. Lost food and salves are the primary costs.

**what it teaches:** How to parry and dodge, how to use cleanse, and how to fight undead.

**what it does not replace:** Normal Favour training or combat. The Wrong Son is a duelist encounter, not a replacement for fighting undead.

---

## Kiln-Worm Noll Saw

**boss_id:** `kiln_worm_noll_saw`

**player shorthand:** "the Worm"

**area:** The Old Kiln, deep in the ash tunnels.

**category:** Lair Boss

**combat level band:** 30–40

**access requirement:** Hearthcraft 20 and completion of Smoke Over Old Town.

**safe/risky/dangerous:** Dangerous

**fantasy:** A giant ash worm that has burrowed through the Old Kiln tunnels. The worm is long, segmented, and covered in hot ash. It is the second lair boss and the first that teaches heat tunnel combat.

**mechanics:**
- Burrows through the tunnel walls. The worm appears from the walls, attacks, and disappears. The player must predict where it will emerge.
- Heat aura deals damage over time. The worm's body is covered in hot ash, and standing near it deals heat damage.
- Segments break independently. The worm has multiple segments, each with its own health bar. Breaking a segment reduces the worm's speed and damage.
- Weak to cold and Tide. Cold spells and Tide beads reduce the heat aura and slow the worm.
- Teaches tunnel combat, heat management, and target prioritization. The player must manage heat and break segments.

**lair:** The Old Kiln tunnels are narrow, hot, and ash-filled. The worm burrows through the walls, and the player must navigate the tunnels.

**inputs:** Food (recommended), cold spells or Tide beads (recommended), armour with heat resistance.

**outputs:** worm_segment, ash_bundle, kiln_worm_tooth, worm_scale (rare), noll_saw_fragment (trophy).

**drop identity:** The worm_segment is a crafting material. The ash_bundle feeds Hearthcraft. The worm_scale is a rare unique for armour. The noll_saw_fragment is a trophy.

**failure state:** The player can retreat to the Old Kiln surface. Death is possible if the worm's heat aura overwhelms. Lost food and beads are the primary costs.

**what it teaches:** How to fight in tunnels, how to manage heat, and how to prioritize targets.

**what it does not replace:** The Old Kiln Watch activity or Ashling in the Kiln. The Worm is a deeper, harder lair boss.

---

## The Door That Bites

**boss_id:** `the_door_that_bites`

**player shorthand:** "the Door"

**area:** Sootstairs, in a hidden room.

**category:** Lair Boss

**combat level band:** 25–35

**access requirement:** Sleight 20 or completion of the quest Keys That Open Nothing.

**safe/risky/dangerous:** Risky

**fantasy:** A mimic door that has learned to bite. The door is a creature disguised as a wooden door, and it attacks anyone who tries to open it. It is the first lair boss that teaches Sleight and trap detection.

**mechanics:**
- Bites when approached. The door snaps shut on anyone who stands in front of it, dealing heavy damage.
- Can be detected with Sleight. A player with Sleight can spot the mimic and avoid the bite.
- Weak to piercing and fire. The door is made of wood, so piercing and fire deal bonus damage.
- Throws lock fragments. The door throws lock fragments that deal ranged damage and slow movement.
- Teaches detection, trap avoidance, and piercing combat. The player must use Sleight and switch weapons.

**lair:** The Sootstairs hidden room is a small chamber with a single door. The door is the boss, and the room is the lair.

**inputs:** Food (recommended), Sleight skill (recommended), piercing weapon or fire spell (recommended).

**outputs:** door_fragment, lock_fragment, mimic_wood, door_hinge (rare), bitten_key (trophy).

**drop identity:** The door_fragment is a crafting material. The mimic_wood feeds Woodcutting. The door_hinge is a rare unique for containers. The bitten_key is a trophy.

**failure state:** The player can retreat to the Sootstairs. Death is possible if the door bites. Lost food is the primary cost.

**what it teaches:** How to detect traps, how to use Sleight, and how to switch weapons.

**what it does not replace:** The Sootstairs Lockroom activity. The Door is a combat encounter, not a puzzle.

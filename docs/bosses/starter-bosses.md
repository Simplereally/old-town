---
doc_type: authority
canonical_path: docs/bosses/starter-bosses.md
parent_index: docs/bosses/00-index.md
root_index: docs/00-index.md
---

Parent: [Bosses Index](00-index.md)

Authority references:
- `docs/bosses/boss-system.md`
- `docs/bosses/boss-categories.md`
- `docs/bosses/boss-mechanics.md`
- `docs/bosses/unique-drops-and-trophies.md`
- `docs/bosses/boss-quest-hooks.md`
- `docs/bosses/boss-balance-rules.md`
- `docs/creatures/minibosses.md`
- `docs/creatures/starter-creatures.md`
- `docs/world/districts-and-routes.md`
- `docs/skills/skill-system.md`
- `docs/combat/signature-mechanics.md`
- `docs/quests/starter-quest-arc.md`

# Starter Bosses

This document defines the six starter bosses: the first named combat encounters a player will fight in Old Town. These are designed for combat levels 1 to 20 and serve as introductions to the boss system. Each starter boss is local, memorable, and tutorial-friendly. A player can walk to any starter boss from the Market Bell in under five minutes.

## Summary Table

| boss_id | display name | player shorthand | area | category | combat level band | access requirement | safe/risky/dangerous |
|---------|--------------|------------------|------|----------|-------------------|--------------------|----------------------|
| `cellar_king` | The Cellar King | "the King" | Sootcellar | Starter Boss | 1–10 | Rats Under Tally's or 8 rat kills | Safe |
| `mudhook_grib` | Mudhook Grib | "the Grib" | North Quarry Road / Tinstone Cut | Starter Boss | 10–20 | Mud on the North Road or Warden task | Risky |
| `ashling_in_the_kiln` | Ashling in the Kiln | "the Ashling" | The Old Kiln | Skilling Boss | 15–25 | Smoke Over Old Town + Old Kiln route | Risky |
| `bell_bat_mother` | The Bell Bat Mother | "the bat mother" | Bellwood Copse / Lath Yard | Starter Boss | 10–20 | Bellwood Yard quest hook | Safe |
| `old_snapper` | Old Snapper | "the Snapper" | River Stoop / Wardenbrook | Skilling Boss | 10–20 | Wardenbrook Fishery or fishing hook | Safe |
| `wrong_flower` | The Wrong Flower | "the Wrong Flower" | Lowgrave | Quest Boss | 15–25 | Gravegate Flowers + Favour 10 | Risky |

---

## The Cellar King

**boss_id:** `cellar_king`

**player shorthand:** "the King"

**area:** Sootcellar, below the Counting House.

**category:** Starter Boss

**combat level band:** 1–10

**access requirement:** Completion of the quest Rats Under Tally's, or 8 cellar rat kills.

**safe/risky/dangerous:** Safe

**fantasy:** A swollen ledger-eating rat that has nested inside ruined account books. The Sootcellar is full of torn pages, chewed bindings, and the smell of old ink. The Cellar King sits on a pile of ledgers, guarding a nest of smaller rats. It is the first named creature a player will fight.

**mechanics:**
- Summons 2 cellar rats at low health. The player must switch targets or clear the adds before they overwhelm.
- Chews ledger piles to heal slightly unless interrupted. The player must stop the heal with a melee attack or a thrown object.
- Weak to shortblades and cudgels. Fast weapons interrupt the chew. Heavy weapons stagger the summon.
- Teaches food timing and target swapping. The player learns to eat food between attacks, not during.

**lair:** The Cellar King's lair is a small alcove in the Sootcellar, marked by a pile of torn ledgers. The lair is a single room with no hazards. The player can retreat to the Sootcellar at any time.

**inputs:** Food (recommended), a shortblade or cudgel (recommended but not required).

**outputs:** ratcatcher_tail, torn_ledger_scrap, cellar_fur_bundle, bent_nail_ring (rare), cellar_king_whisker (trophy).

**drop identity:** The ratcatcher_tail is a proof item for Wardenry. The torn_ledger_scrap feeds Cartography. The bent_nail_ring is a rare starter unique. The cellar_king_whisker is a trophy.

**failure state:** The player can retreat to the Sootcellar at any time. No death penalty. Lost food is the only cost.

**what it teaches:** How to eat food, how to switch targets, and how to interrupt a heal.

**what it does not replace:** Normal combat training at the Sootcellar or the Warden Steps. The Cellar King is a named encounter, not a replacement for fighting rats.

---

## Mudhook Grib

**boss_id:** `mudhook_grib`

**player shorthand:** "the Grib"

**area:** North Quarry Road, near the Tinstone Cut entrance.

**category:** Starter Boss

**combat level band:** 10–20

**access requirement:** Completion of the quest Mud on the North Road, or a Wardenry contract assignment.

**safe/risky/dangerous:** Risky

**fantasy:** A mud goblin foreman who wears quarry scrap as armour. He has claimed a stretch of the North Quarry Road as his territory, shaking down travellers and stealing tools. He is covered in mud, rust, and pig iron scrap. He is the first boss that teaches armour and stagger.

**mechanics:**
- High guard against weak ranged attacks. Arrows and knives bounce off his scrap shield.
- Periodically raises a scrap shield. The shield blocks all melee damage from the front.
- Javelins and mauls break the shield faster. The player must switch to a heavy weapon or a piercing ranged weapon.
- Throws mud to slow movement. The player must move to a safe tile or eat food to recover speed.
- Teaches armour, stagger, and weapon switching. The player learns that not all weapons work against all defences.

**lair:** Mudhook Grib's lair is a mud pit on the North Quarry Road, surrounded by broken carts and rusted tools. The lair is a single room with mud tiles that slow movement.

**inputs:** Food (recommended), a javelin or maul (recommended), a weapon that can pierce armour.

**outputs:** pig_iron_scrap_bundle, mudhook_charm, crude_hookblade, quarry_token, mudhook_jaw (trophy).

**drop identity:** The pig_iron_scrap_bundle feeds Smithing. The mudhook_charm is a unique accessory. The crude_hookblade is a starter weapon. The quarry_token is an activity currency. The mudhook_jaw is a trophy.

**failure state:** The player can retreat to the North Quarry Road. Death is possible but rare. Lost food is the primary cost.

**what it teaches:** How to switch weapons against armour, how to break shields, and how to manage movement debuffs.

**what it does not replace:** Normal mining or smithing at the Foundry Row. Mudhook Grib is a combat encounter, not a gathering target.

---

## Ashling in the Kiln

**boss_id:** `ashling_in_the_kiln`

**player shorthand:** "the Ashling"

**area:** The Old Kiln, near the Sootcellar and Foundry Row.

**category:** Skilling Boss

**combat level band:** 15–25

**access requirement:** Completion of the quest Smoke Over Old Town, and the Old Kiln route unlocked.

**safe/risky/dangerous:** Risky

**fantasy:** A young ash drake nesting in the old municipal kiln. The kiln is still warm, and the drake has claimed the ash piles as its nest. The heat is irregular, the smoke is thick, and the drake is territorial. It is the first boss that teaches heat, movement, and Tide bead usage.

**mechanics:**
- Heat bursts on floor tiles. The drake flares the kiln, creating hot tiles that deal damage over time.
- Smoke vents reduce line of sight. The player cannot see the drake clearly when the smoke is thick.
- Tide spells and Tide beads reduce heat stacks. The player can use Tide magic to cool the kiln and reduce the heat damage.
- Ranged attacks can hit the drake safely but the player must move to avoid heat bursts.
- Melee attacks can punish the drake during cooling windows but are risky due to heat.
- Teaches heat management, positioning, and Tide bead usage. The player learns that preparation matters.

**lair:** The Old Kiln is a small, circular room with a central furnace and ash piles around the walls. The lair has heat tiles that pulse and smoke vents that obscure vision.

**inputs:** Food (recommended), Tide beads or Tide spells (recommended), ranged weapon or melee weapon with high heat resistance.

**outputs:** warm_scale, blackcoal_ash, drake_tooth, tallow_drake_scale (rare), ashling_ember (trophy).

**drop identity:** The warm_scale is a crafting material for Hearthcraft. The blackcoal_ash feeds Beadwork. The tallow_drake_scale is a rare unique for crafting. The ashling_ember is a trophy.

**failure state:** The player can retreat to the Foundry Row. Death is possible if the player stands on heat tiles too long. Lost food is the primary cost.

**what it teaches:** How to manage heat, how to use Tide beads, and how to switch between ranged and melee.

**what it does not replace:** The Old Kiln Watch activity. The skilling boss is a combat encounter. The activity is a skilling loop.

---

## The Bell Bat Mother

**boss_id:** `bell_bat_mother`

**player shorthand:** "the bat mother"

**area:** Bellwood Copse, in the Lath Yard rafters.

**category:** Starter Boss

**combat level band:** 10–20

**access requirement:** Completion of the quest Bellwood Yard, or Bellwood Copse route unlocked.

**safe/risky/dangerous:** Safe

**fantasy:** An enormous bell-roosting bat that carries stolen strings in its claws. The bat has claimed the rafters of the Lath Yard as its nest, hanging upside down with a swarm of smaller bell bats. It is the first boss that teaches ranged and magic target switching.

**mechanics:**
- Alternates between roost and swoop. When roosting, the bat is weak to ranged and magic. When swooping, it is weak to melee.
- Summons bell bats during the roost phase. The player must clear the adds or they will overwhelm.
- Ranged and magic are favored during the roost phase. Melee is favored during the swoop phase.
- Sound pulse interrupts slow weapons. The bat screeches, interrupting slow melee attacks and long spell casts.
- Teaches style switching and add management. The player learns to adapt their weapon to the boss's phase.

**lair:** The Lath Yard rafters are a high, open space with wooden beams and hanging ropes. The bat hangs from the central beam, and the adds swarm from the corners.

**inputs:** Food (recommended), a ranged weapon and a melee weapon (recommended), or a magic spell set.

**outputs:** bellfeather_bundle, wing_hide_roll, echo_dust, bellfang_charm (rare), bat_mother_claw (trophy).

**drop identity:** The bellfeather_bundle feeds Tailoring. The wing_hide_roll is a crafting material. The bellfang_charm is a rare unique accessory. The bat_mother_claw is a trophy.

**failure state:** The player can retreat to the Bellwood Copse. No death penalty. Lost food is the only cost.

**what it teaches:** How to switch combat styles, how to manage adds, and how to avoid interrupts.

**what it does not replace:** Normal bowcraft or magic training. The Bell Bat Mother is a combat encounter, not a skilling target.

---

## Old Snapper

**boss_id:** `old_snapper`

**player shorthand:** "the Snapper"

**area:** River Stoop / Wardenbrook, in the water near the ferry dock.

**category:** Skilling Boss

**combat level band:** 10–20

**access requirement:** Wardenbrook Fishery unlocked, or fishing hook quest.

**safe/risky/dangerous:** Safe

**fantasy:** A scarred river snapper that knows where bait comes from. The snapper has been stealing bait from the River Stoop for years and has grown large and cunning. It is the first boss that teaches fishing and combat crossover.

**mechanics:**
- Surfaces on predictable water tiles. The snapper appears on a pattern of tiles, and the player can predict where it will surface.
- Bites players near the water edge. If the player stands too close, the snapper bites, dealing melee damage.
- Can be lured with bait. The player can throw bait to draw the snapper to a specific tile.
- Cooking and fishing items improve preparation. Better bait, better food, and better fishing gear make the fight easier.
- Melee is risky due to the bite. Ranged is safe but slower. Magic is medium risk and medium reward.
- Teaches bait usage, positioning, and combat style choice. The player learns that preparation and position matter.

**lair:** The River Stoop water edge is a narrow strip of sand and rocks. The snapper surfaces in the water, and the player stands on the bank.

**inputs:** Food (recommended), bait (recommended), fishing gear (optional but helpful).

**outputs:** snapper_meat, shell_chip_bundle, river_tooth, old_snapper_shell (rare), snapped_hook (trophy).

**drop identity:** The snapper_meat is a cooking ingredient. The shell_chip_bundle feeds crafting. The old_snapper_shell is a rare unique for crafting. The snapped_hook is a trophy.

**failure state:** The player can retreat to the River Stoop. No death penalty. Lost bait and food are the primary costs.

**what it teaches:** How to use bait, how to position for combat, and how to choose a combat style.

**what it does not replace:** Normal fishing or cooking at the River Stoop. The snapper is a combat encounter, not a gathering target.

---

## The Wrong Flower

**boss_id:** `wrong_flower`

**player shorthand:** "the Wrong Flower"

**area:** Lowgrave, near the Gravegate.

**category:** Quest Boss

**combat level band:** 15–25

**access requirement:** Completion of the quest Gravegate Flowers, and Favour 10.

**safe/risky/dangerous:** Risky

**fantasy:** A grave flower planted in the wrong grave, now walking around wearing soil like a coat. The flower has absorbed the wrong spirit and has become a mobile, hostile plant. It is the first boss that teaches Favour, candles, and rot cleanse.

**mechanics:**
- Rot aura if candles go out. The flower emits a rot aura that deals damage over time unless the player has lit shrine candles.
- Grave mites spawn from bad soil. The flower's footsteps leave bad soil that spawns mites. The player must clear the soil or the mites will overwhelm.
- Lighting shrine candles weakens the flower. The player must light candles around the graveyard to reduce the rot aura.
- Favour and prayer knots reduce rot pressure. The player can use Favour abilities to cleanse the rot and reduce the aura.
- Fire damage helps but can enrage if careless. Too much fire makes the flower aggressive, increasing its attack speed.
- Teaches Favour usage, candle management, and rot cleanse. The player learns that skill actions matter in combat.

**lair:** The Lowgrave graveyard is a small, enclosed area with graves, candles, and a shrine. The flower moves between graves, and the player must light candles and clear soil.

**inputs:** Food (recommended), candles (required), Favour ability or prayer knots (recommended), fire weapon (optional but risky).

**outputs:** grave_flower_seed, grave_dust_bundle, cleanroot_wash, wrong_flower_petal (rare), polite_root (trophy).

**drop identity:** The grave_flower_seed feeds Gardening. The grave_dust_bundle is a crafting material. The cleanroot_wash is a consumable. The wrong_flower_petal is a rare unique for crafting. The polite_root is a trophy.

**failure state:** The player can retreat to the Lowgrave Chapel. Death is possible if the rot aura is too strong. Lost candles and food are the primary costs.

**what it teaches:** How to use Favour in combat, how to manage candles, and how to cleanse rot.

**what it does not replace:** Normal Favour training at the Shrine Hearth or Lowgrave Chapel. The Wrong Flower is a combat encounter, not a skilling target.

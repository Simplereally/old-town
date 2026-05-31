---
doc_type: authority
canonical_path: docs/activities/first-ring-activities.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-system.md`
- `docs/activities/activity-categories.md`
- `docs/activities/starter-activities.md`
- `docs/activities/skilling-bosses.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-currencies.md`
- `docs/activities/activity-balance-rules.md`
- `docs/activities/activity-quest-hooks.md`
- `docs/areas/area-progression-system.md`
- `docs/guilds/first-ring-guilds.md`
- `docs/world/districts-and-routes.md`

# First-Ring Activities

This document defines the eight repeatable activities in first-ring areas beyond Old Town. These are designed for levels 20 to 40 and require travel outside the town walls. They are more rewarding than starter activities but demand more attention, better tools, or tolerance for risk.

## Summary Table

| activity_id | display name | player shorthand | location | category | skills trained | entry requirement | safe/risky/dangerous |
|-------------|--------------|------------------|----------|----------|----------------|-------------------|----------------------|
| `crowmile_relay` | Crowmile Relay | "the relay" | Crowmile Road | Course | Wayfaring, Cartography | Wayfaring 20, mapped route to Crowmile | Safe |
| `bellwood_replant` | Bellwood Replant | "the replant" | Bellwood Copse | Skilling Activity | Woodcutting, Gardening, Bowcraft | Woodcutting 20 | Safe |
| `quarry_shift` | Quarry Shift | "the quarry" | Tinstone Cut | Risk Activity | Mining, Smithing | Mining 20, route unlock to Tinstone Cut | Risky |
| `patchfield_drive` | Patchfield Drive | "the drive" | Patchfield | Skilling Activity | Trapping, Tailoring | Trapping 20 or Tailoring 20 | Safe |
| `wardenbrook_tide` | Wardenbrook Tide | "the tide" | Wardenbrook | Skilling Boss | Fishing, Cooking, Wayfaring | Fishing 20, route unlock to Wardenbrook | Dangerous |
| `lowgrave_vigil` | Lowgrave Vigil | "the vigil" | Lowgrave | Skilling Boss | Favour, Gardening, Hearthcraft, Apothecary | Favour 20, `Gravegate Flowers` completed | Risky |
| `old_kiln_watch` | Old Kiln Watch | "the watch" | The Old Kiln | Skilling Boss | Hearthcraft, Beadwork, Magic | Hearthcraft 20 or Beadwork 20, `Smoke Over Old Town` completed | Dangerous |
| `sootstairs_lockroom` | Sootstairs Lockroom | "the lockroom" | Sootstairs | Puzzle Activity | Sleight, Cartography | Sleight 20 or `Keys That Open Nothing` completed | Risky |

---

## Crowmile Relay

**activity_id:** `crowmile_relay`

**player shorthand:** "the relay"

**location:** Crowmile Road, from the road fork to the safe camp.

**category:** Course

**skills trained:** Wayfaring, Cartography

**entry requirement:** Wayfaring 20 and a mapped route to Crowmile Road.

**safe/risky/dangerous:** Safe

**loop description:** The player maintains road markers and warning bells along Crowmile Road. Actions: follow old road posts, repair marker stakes that have fallen, avoid crows and minor bandits, map new bends, and light safe-camp markers. The route changes slightly each run as weather shifts the road.

**inputs:** Road stakes, tinder, chalk (provided or purchased).

**outputs:** Wayfaring XP, Cartography XP, road markers, chalk marks, Road Token.

**reward identity:** Road Tokens can be exchanged for route cosmetics, shortcut unlocks, and the Crowmile Road Ribbon.

**failure state:** If the player takes too long, the camp markers extinguish and the route must be retraced. No penalty beyond lost time.

**what it teaches:** How to map unfamiliar routes, how to maintain waypoints, and how to navigate weather-affected terrain.

**what it does not replace:** Open-world exploration. The relay is a structured route, not a replacement for wandering the roads.

---

## Bellwood Replant

**activity_id:** `bellwood_replant`

**player shorthand:** "the replant"

**location:** Bellwood Copse.

**category:** Skilling Activity

**skills trained:** Woodcutting, Gardening, Bowcraft

**entry requirement:** Woodcutting 20.

**safe/risky/dangerous:** Safe

**loop description:** The player cuts marked trees in the copse, spares protected saplings, replants slips in designated spots, sorts bow staves by quality, and scares off Road Crows that peck at the saplings. The copse has a regrowth meter that improves when replanting outpaces cutting.

**inputs:** A woodcutting axe (provided or personal), sapling slips (provided).

**outputs:** Woodcutting XP, Gardening XP, Bowcraft XP, logs, bow staves, bark, Replant Token.

**reward identity:** Replant Tokens can be exchanged for bowcraft materials, woodcutting tools, and the Bellwood Axe Mark cosmetic.

**failure state:** If the player cuts a protected sapling, the forester scolds them and the run is paused. No penalty beyond lost time.

**what it teaches:** How to balance cutting and replanting, how to sort materials by quality, and how to protect young growth.

**what it does not replace:** Real woodcutting or real bowcraft. The marked trees are selected and the saplings are provided.

---

## Quarry Shift

**activity_id:** `quarry_shift`

**player shorthand:** "the quarry"

**location:** Tinstone Cut.

**category:** Production Activity / Risk Activity

**skills trained:** Mining, Smithing

**entry requirement:** Mining 20 and route unlock to Tinstone Cut.

**safe/risky/dangerous:** Risky

**loop description:** The player works a shift at the Tinstone Cut quarry. Actions: deliver ore carts from deep faces, sort blackcoal by grade, repair bellows on the portable furnace, smelt timed batches, and hammer flawed ingots. The quarry has a cave-in risk that increases the longer the player stays. Cave-ins damage tools and interrupt production.

**inputs:** Mining tools, blackcoal, ore (provided or gathered).

**outputs:** Mining XP, Smithing XP, ore bundles, ingots, rivets, Quarry Token.

**reward identity:** Quarry Tokens can be exchanged for mining tools, repair discounts, and the Quarry Worker apron cosmetic.

**failure state:** If a cave-in occurs, the current batch is ruined and the player must retreat to a safe area. Tools may be damaged. Inputs are lost.

**what it teaches:** How to manage risk in a production environment, how to balance speed and safety, and how to repair equipment under pressure.

**what it does not replace:** Real mining or real smithing. The quarry is a controlled environment with artificial hazards.

---

## Patchfield Drive

**activity_id:** `patchfield_drive`

**player shorthand:** "the drive"

**location:** Patchfield.

**category:** Skilling Activity

**skills trained:** Trapping, Tailoring

**entry requirement:** Trapping 20 or Tailoring 20.

**safe/risky/dangerous:** Safe

**loop description:** The player drives rabbits and foxes toward snares in the Patchfield. Actions: set snares, repair torn nets, drive creatures toward the traps, cure hides at the field station, and sort clean from dirty pelts. Road Crows occasionally steal trapped creatures and must be shooed away.

**inputs:** Snares, nets, curing salt (provided or purchased).

**outputs:** Trapping XP, Tailoring XP, hides, sinew cords, fur bundles, Drive Token.

**reward identity:** Drive Tokens can be exchanged for tailoring materials, trap upgrades, and the Patchfield Hide Stamp cosmetic.

**failure state:** If a creature escapes the trap, the snare is lost and must be replaced. No penalty beyond lost materials.

**what it teaches:** How to manage a trapping line, how to cure hides in the field, and how to protect catches from scavengers.

**what it does not replace:** Real trapping or real tailoring. The field is a controlled environment and the creatures are common species.

---

## Wardenbrook Tide

**activity_id:** `wardenbrook_tide`

**player shorthand:** "the tide"

**location:** Wardenbrook ferry dock.

**category:** Skilling Boss

**skills trained:** Fishing, Cooking, Wayfaring

**entry requirement:** Fishing 20 and route unlock to Wardenbrook.

**safe/risky/dangerous:** Dangerous

**loop description:** The player works the ferry dock during a bad tide. Actions: mend torn nets, haul fish baskets from the surge, cook emergency rations on the dock hearth, dodge wave tiles that sweep the dock, secure ferry ropes before they snap, and scare off River Snappers that attack the baskets. The tide has a surge meter that increases over time. Higher surge means more fish but more danger.

**inputs:** Nets, baskets, rope, tinder (provided or purchased).

**outputs:** Fishing XP, Cooking XP, Wayfaring XP, fish crates, river bait, Tide Token.

**reward identity:** Tide Tokens can be exchanged for ferry-route cosmetics and the Wardenbrook Angler Pin. Fish hamper upgrades are also earned directly during successful tides. Rare chance at an Argent Ray clue.

**failure state:** If the player is swept off the dock by a wave, they are washed downstream and must recover at the bank. Fish baskets are lost. If a basket is snapped by a River Snapper, the fish are lost.

**what it teaches:** How to manage multiple tasks under environmental pressure, how to prioritise actions, and how to read tide patterns.

**what it does not replace:** Real fishing or real cooking. The tide is a special event and the dock is a fixed location.

---

## Lowgrave Vigil

**activity_id:** `lowgrave_vigil`

**player shorthand:** "the vigil"

**location:** Lowgrave Chapel and surrounding graves.

**category:** Skilling Boss

**skills trained:** Favour, Gardening, Hearthcraft, Apothecary

**entry requirement:** Favour 20 and completion of the quest `Gravegate Flowers`.

**safe/risky/dangerous:** Risky

**loop description:** The player keeps the graves polite through the night. Actions: plant grave flowers, light shrine candles, clear rot patches that spread from forgotten graves, offer bone chips at the shrine, brew simple washes to cleanse rot, and keep Grave Wisps calm. The rot has a spread meter that increases if neglected. Grave Wisps become hostile if too many candles fail.

**inputs:** Grave flower seeds, candles, bone chips, water, herbs (provided or gathered).

**outputs:** Favour XP, Gardening XP, Hearthcraft XP, Apothecary XP, grave flowers, rot-resistant salves, grave ash, Vigil Token.

**reward identity:** Vigil Tokens can be exchanged for grave flower seeds, salve recipes, and the Lowgrave Candle Trim cosmetic. Candle trims are also earned directly during successful vigils. Rare chance at a Gravekeeper's Tooth fragment.

**failure state:** If the rot spreads too far, the player is forced to retreat to the chapel. If a Grave Wisp becomes hostile, the player must flee. Lost materials are not recovered.

**what it teaches:** How to manage multiple timed tasks under environmental pressure, how to use Favour rites in a dangerous context, and how to brew under time pressure.

**what it does not replace:** Real Favour training or real gardening. The vigil is a night-time activity and the hazards are supernatural.

---

## Old Kiln Watch

**activity_id:** `old_kiln_watch`

**player shorthand:** "the watch"

**location:** The Old Kiln House.

**category:** Skilling Boss

**skills trained:** Hearthcraft, Beadwork, Magic

**entry requirement:** Hearthcraft 20 or Beadwork 20, and completion of the quest `Smoke Over Old Town`.

**safe/risky/dangerous:** Dangerous

**loop description:** The player keeps the Old Kiln alive while firing beads and preventing drake smoke. Actions: shovel ash from the kiln floor, feed the correct fuel (blackcoal, tallow, or ember shards), vent smoke before it accumulates, fire bead batches at the correct temperature, dodge heat bursts that flare from the kiln mouth, and stop Ash Drake Whelps from nesting in the warm ash. The kiln has a stability meter that decreases if neglected. If it reaches zero, the kiln erupts and the encounter ends.

**inputs:** Blackcoal, tallow, ember shards, bead clay, glass sand (provided or gathered).

**outputs:** Hearthcraft XP, Beadwork XP, Magic XP, fired beads, ash materials, ember beads, Kiln Token.

**reward identity:** Kiln Tokens can be exchanged for bead-firing materials, heat-safe firing access, and the Kilnwatch Oath cosmetic. Ashproof gloves are also earned directly during successful watches. Rare chance at a Tallow Drake Scale.

**failure state:** If the kiln erupts, the player is forced to retreat and all materials in the kiln are lost. If an Ash Drake Whelp bites the player, the bite interrupts the current action and deals minor damage.

**what it teaches:** How to manage a complex multi-task system under time pressure, how to prioritise actions, and how to handle environmental hazards.

**what it does not replace:** Real beadwork or real hearthcraft. The kiln is unstable and the drake whelps are a special hazard.

---

## Sootstairs Lockroom

**activity_id:** `sootstairs_lockroom`

**player shorthand:** "the lockroom"

**location:** Sootstairs Rooms.

**category:** Puzzle Activity

**skills trained:** Sleight, Cartography

**entry requirement:** Sleight 20 or completion of the quest `Keys That Open Nothing`.

**safe/risky/dangerous:** Risky

**loop description:** The player practices on doors that do not all lead to rooms. Actions: pick locks on a series of doors, identify false doors that open to brick walls, map hidden routes that connect the real doors, avoid cutpurse distractions that steal tools, open reward drawers behind the correct doors, and escape before the Sootstairs bell tolls. The lockroom has a bell count that decreases each time the player picks a wrong door.

**inputs:** Lockpicks (provided or personal), chalk, map paper (provided).

**outputs:** Sleight XP, Cartography XP, lockpick variants, false-bottom pouch parts, suspicious receipts, Lockroom Token.

**reward identity:** Lockroom Tokens can be exchanged for Sleight tools, lockpick upgrades, and the Blacksealed Cloak cosmetic. The false-bottom pouch is assembled from parts earned over multiple runs.

**failure state:** If the bell count reaches zero before the player escapes, the lockroom resets and all progress on the current run is lost. Tools are not lost.

**what it teaches:** How to read locks, how to map hidden spaces, and how to manage risk under a countdown.

**what it does not replace:** Real Sleight training or real lockpicking. The lockroom is a practice space and the locks are artificial.

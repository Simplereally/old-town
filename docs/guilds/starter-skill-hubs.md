---
doc_type: authority
canonical_path: docs/guilds/starter-skill-hubs.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

Parent: [Guilds Index](00-index.md)

Authority references:
- `docs/guilds/guild-system.md`
- `docs/guilds/first-ring-guilds.md`
- `docs/world/districts-and-routes.md`
- `docs/world/npc-cast.md`
- `docs/world/starter-economy-loops.md`
- `docs/skills/skill-system.md`
- `docs/tools-and-intermediates/stations.md`
- `docs/map/station-placement.md`

# Starter Skill Hubs

Old Town has nine starter skill hubs. Each hub is a physical district that teaches a repeatable skill loop through a named NPC, a cluster of stations, and nearby resources. Players call them by shorthand. No membership is required.

---

## Foundry Row

**hub_id:** `foundry_row`

Players call it "Foundry." This hub teaches Mining and Smithing. Osric Penny stands by the Anvil and sells pennywrought pickaxes and hammers. The training loop is simple: mine copper and tin at the north quarry, smelt a Pennywrought Ingot at the Bellows Furnace, then forge a shortblade or helm at the Anvil. The starter service is tool sales and basic repair. The starter resources are `penny_copper_ore` and `tinstone_ore`. Mud Goblins prowl the north quarry road, so new miners learn to run or fight early. The first quest hook is `A Penny for the Forge`. What it teaches: how to turn raw ore into usable metal gear.

## Lath Yard

**hub_id:** `lath_yard`

Players call it "Lath." This hub teaches Woodcutting and Bowcraft. Letha Lath tends the Bow Bench and sells strings and shafts. The training loop: cut Oldroad Oak or Lathwood near Oldroad Gate, whittle shafts and staves, then string a Lathwood Shortbow. The starter service is bow part sales and stringing advice. The starter resources are `oldroad_oak` and `lathwood`. Stray Dogs wander the alleys between here and the Market Bell, so woodcutters learn to keep an eye out. The first quest hook is `String Enough to Sing`. What it teaches: how to turn a log into a working bow.

## Patch Lane

**hub_id:** `patch_lane`

Players call it "Patch Lane" or "Lane." This hub teaches Trapping and Tailoring. Nell Patch runs the Curing Frame and sells thread. The training loop: trap rabbits or foxes south of town, cure the hide at the Curing Frame, then stitch a Patchhide Coif or Jerkin. The starter service is hide curing and cloth repair. The starter resources are `rabbit_hide` and `fox_hide`. Bog Foxes fight back in the south fields, so trappers learn that not every creature is passive. The first quest hook is `The Patchwife's Errand`. What it teaches: how to turn a pelt into protective leather.

## Chalkhouse Court

**hub_id:** `chalkhouse_court`

Players call it "Chalk." This hub teaches Beadwork and Magic. Pippa Hearth minds the Bead Kiln and sells primer beads and basic wands. The training loop: gather Bead Clay or Glass Sand, fire beads at the Bead Kiln, string them at the Bead Loom, then cast Ember Flick with a Chalkmarked Wand. The starter service is bead supply and casting advice. The starter resources are `bead_clay` and `glass_sand`. Bell Bats roost in the old roofs nearby, giving young mages their first moving target. The first quest hook is `The Beadwife's Errand`. What it teaches: how to craft magical components and cast your first spell.

## River Stoop

**hub_id:** `river_stoop`

Players call it "River" or "Stoop." This hub teaches Fishing and Cooking. Pell Hookline sells bait and buys fish by the Kitchen Range. The training loop: fish Ditch Shrimp or Tinfin from the river, cook on the Kitchen Range or Market Hearth, then make Bellbread or Tinfin Pie. The starter service is bait sales and fish buying. The starter resources are `ditch_shrimp` and `tinfin`. Slippery banks and the occasional Stray Dog mean anglers learn to watch their footing. The first quest hook is `The River's Gift`. What it teaches: how to gather food from water and turn it into meals.

## Shrine Hearth

**hub_id:** `shrine_hearth`

Players call it "Shrine." This hub teaches Favour and Hearthcraft. Sister Writ tends the Shrine Hearth and sells candles. The training loop: light shrine candles, make offerings, receive blessings, and use Hearthcraft to keep the flame alive. The starter service is candle sales and curse cleansing. The starter resources are `shrine_candles` and `offerings`. Grave Mites creep at the Gravegate edge, reminding shrine visitors that danger sits close to holy ground. The first quest hook is `Shrine Tending`. What it teaches: how to use divine favour and fire-tending as practical skills.

## Oldroad Gate

**hub_id:** `oldroad_gate`

Players call it "Oldroad." This hub teaches Wayfaring and Cartography. Finch Quill keeps the Map Table and sells blank maps and route scrolls. The training loop: survey landmarks around the gate, sketch trail segments at the Map Table, and unlock shortcut routes. The starter service is map sales and route advice. The starter resources are `survey_data` and `blank_maps`. Mud Goblins block the north quarry road, so surveyors learn that exploration carries risk. The first quest hook is `The Lost Survey`. What it teaches: how to expand your map and move faster through the world.

## Warden Steps

**hub_id:** `warden_steps`

Players call it "Warden." This hub teaches Wardenry and basic combat tasks. Warden Holt stands by the Warden Board and issues starter contracts. The training loop: accept a contract from the Warden Board, kill the target creatures, bring back proof such as a Ratcatcher Tail, and claim coins or Favour. The starter service is contract issuance and deed stamping. The starter resources are `ratcatcher_tails` and `contract_proofs`. Cellar Rats in Sootcellar and Grave Mites at Gravegate give new wardens plenty of early targets. The first quest hook is `Rats Under Tally's`. What it teaches: how to turn combat into a structured, repeatable job.

## Sootcellar

**hub_id:** `sootcellar`

Players call it "Cellar." This hub teaches low-level combat and Sleight. Marn Lock sells lockpicks and teaches the basics of picking pockets and opening locks. The training loop: fight Cellar Rats for tails and bones, practice Sleight on nearby stalls or simple locks, and trade blacksealed hints. The starter service is lockpick sales and Sleight tutoring. The starter resources are `rat_tails`, `small_bones`, and `torn_cloth`. More rats than expected swarm the lower tunnels, and Ash Drake Whelps lurk deeper down, so cellar explorers learn caution fast. The first quest hook is `The Missing Bell-Clapper`. What it teaches: how to survive your first fights and learn the underbelly economy.

---

## Summary Table

| hub_id | Area | Skills | Shorthand | NPC |
|--------|------|--------|-----------|-----|
| `foundry_row` | Foundry Row | Mining, Smithing | Foundry | Osric Penny |
| `lath_yard` | Lath Yard | Woodcutting, Bowcraft | Lath | Letha Lath |
| `patch_lane` | Patch Lane | Trapping, Tailoring | Patch | Nell Patch |
| `chalkhouse_court` | Chalkhouse Court | Beadwork, Magic | Chalk | Pippa Hearth |
| `river_stoop` | River Stoop | Fishing, Cooking | River, Stoop | Pell Hookline |
| `shrine_hearth` | Shrine Hearth | Favour, Hearthcraft | Shrine | Sister Writ |
| `oldroad_gate` | Oldroad Gate | Wayfaring, Cartography | Oldroad | Finch Quill |
| `warden_steps` | Warden Steps | Wardenry, combat tasks | Warden | Warden Holt |
| `sootcellar` | Sootcellar | low combat, Sleight | Cellar | Marn Lock |

---

*Last updated: 2026-05-31*

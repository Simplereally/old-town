---
doc_type: authority
canonical_path: docs/activities/starter-activities.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-system.md`
- `docs/activities/activity-categories.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-currencies.md`
- `docs/activities/activity-balance-rules.md`
- `docs/activities/activity-quest-hooks.md`
- `docs/world/districts-and-routes.md`
- `docs/world/npc-cast.md`
- `docs/skills/skill-system.md`
- `docs/guilds/starter-skill-hubs.md`

# Starter Activities

This document defines the eight repeatable activities inside Old Town proper. These are designed for levels 1 to 20 and serve as introductions to the activity system. Each starter activity is small, local, and tutorial-friendly. A player can walk to any starter activity from the Market Bell in under a minute.

## Summary Table

| activity_id | display name | player shorthand | location | category | skills trained | entry requirement | safe/risky/dangerous |
|-------------|--------------|------------------|----------|----------|----------------|-------------------|----------------------|
| `bell_run` | Bell Run | "the run" | Market Bell to Oldroad Gate | Course | Wayfaring, Cartography | Wayfaring 1 | Safe |
| `soot_sweep` | Soot Sweep | "the sweep" | Sootcellar | Public Work / Combat-lite | Arms, Guard, Sleight | Arms 1 | Risky |
| `ledger_sort` | Ledger Sort | "the sort" | Counting House | Puzzle / Public Work | Cartography, Sleight | Cartography 1 | Safe |
| `market_rush` | Market Rush | "the rush" | Market Bell | Public Work | Wayfaring, Cooking | Cooking 1 | Safe |
| `graveflower_round` | Graveflower Round | "the round" | Shrine Hearth to Gravegate | Skilling Activity | Favour, Gardening | Favour 1 | Safe |
| `foundry_shift` | Foundry Shift | "the shift" | Foundry Row | Production Activity | Smithing, Mining | Smithing 1 | Safe |
| `kilnwatch_primer` | Kilnwatch Primer | "the primer" | Chalkhouse Court | Production Activity | Hearthcraft, Beadwork | Hearthcraft 1 | Safe |
| `river_basket` | River Basket | "the basket" | River Stoop | Skilling Activity | Fishing, Cooking | Fishing 1 | Safe |

---

## Bell Run

**activity_id:** `bell_run`

**player shorthand:** "the run"

**location:** Starts at the Market Bell, runs through Old Town to the Oldroad Gate, and returns.

**category:** Course

**skills trained:** Wayfaring, Cartography

**entry requirement:** Wayfaring 1

**safe/risky/dangerous:** Safe

**loop description:** The player carries a message from the Market Bell to one of three district signposts (Foundry Row, River Stoop, or Oldroad Gate), rings a small bell at the destination, and returns before the message expires. The route has shortcuts through alleys and courtyards that become available as Wayfaring level increases.

**inputs:** None. The player receives a message satchel at the start.

**outputs:** Wayfaring XP, Cartography XP, small coins, Bell Token.

**reward identity:** Bell Tokens can be exchanged for route hints, district maps, and the Bell Runner ribbon cosmetic.

**failure state:** If the player does not return before the message expires, the satchel disappears and the run fails. No penalty beyond lost time.

**what it teaches:** How to navigate Old Town efficiently, how to use shortcuts, and how to read the district map.

**what it does not replace:** Open-world exploration. The Bell Run is a structured route, not a replacement for walking around Old Town freely.

---

## Soot Sweep

**activity_id:** `soot_sweep`

**player shorthand:** "the sweep"

**location:** Sootcellar and the lower sootstairs.

**category:** Public Work / Combat-lite

**skills trained:** Arms, Guard, Sleight

**entry requirement:** Arms 1

**safe/risky/dangerous:** Risky

**loop description:** The player sweeps soot piles from the Sootcellar floor, clearing paths and reducing the chance of Grave Mite spawns. Occasionally, Grave Mites emerge from the soot and must be fought or fled. Cleared areas grant small coin rewards and reduce the town's soot accumulation meter.

**inputs:** A broom (provided at the start) or a personal weapon.

**outputs:** Arms XP, Guard XP, Sleight XP, small coins, soot ash (crafting material), Soot Mark.

**reward identity:** Soot ash can be sold to the Old Kiln House for beadwork materials. Large sweeps grant the Soot Sweeper apron cosmetic.

**failure state:** If the player is overwhelmed by Grave Mites, they are forced to retreat to the surface. No death penalty, but the sweep is incomplete.

**what it teaches:** How to fight weak creatures in confined spaces, how to manage multiple threats, and how to use the environment to your advantage.

**what it does not replace:** Combat training at Warden Steps or combat yards. Grave Mites are weak and the space is narrow. Real combat training happens elsewhere.

---

## Ledger Sort

**activity_id:** `ledger_sort`

**player shorthand:** "the sort"

**location:** Counting House, near the Market Bell.

**category:** Puzzle / Public Work

**skills trained:** Cartography, Sleight

**entry requirement:** Cartography 1

**safe/risky/dangerous:** Safe

**loop description:** The player sorts damaged ledger pages into correct piles: names, seals, amounts, and dates. Some pages are water-damaged or rat-chewed and must be matched by partial information. Rats occasionally scurry across the table and must be shooed away. Correctly sorted bundles are submitted to the clerk for a reward.

**inputs:** None. Ledger pages are provided.

**outputs:** Cartography XP, Sleight XP, small coins, Ledger Sort discount voucher.

**reward identity:** Discount vouchers reduce the cost of civic services (bank fees, permit costs). The Counting House Clerk cosmetic is awarded for 100 correct sorts.

**failure state:** If the player submits an incorrect bundle, the clerk rejects it and the pages must be re-sorted. No penalty beyond lost time.

**what it teaches:** How to read maps and documents, how to spot forgeries, and how to manage partial information.

**what it does not replace:** Quest investigations or real document work. The ledgers are simplified and the rats are a distraction, not a real threat.

---

## Market Rush

**activity_id:** `market_rush`

**player shorthand:** "the rush"

**location:** Market Bell and surrounding market stalls.

**category:** Public Work

**skills trained:** Wayfaring, Cooking

**entry requirement:** Cooking 1

**safe/risky/dangerous:** Safe

**loop description:** The player helps market vendors by delivering fresh ingredients from the River Stoop to the Market Bell before they spoil. The player receives a basket of fish, vegetables, or grain at the River Stoop, carries it to the Market Bell, and hands it to the correct vendor. Faster deliveries earn more rewards.

**inputs:** A market basket (provided). The ingredients are pre-gathered.

**outputs:** Wayfaring XP, Cooking XP, small coins, Market Token.

**reward identity:** Market Tokens can be exchanged for cooking ingredients, recipe hints, and the Market Runner ribbon cosmetic.

**failure state:** If the player takes too long, the ingredients spoil and the delivery fails. No penalty beyond lost time.

**what it teaches:** How to navigate under time pressure, how to manage inventory, and how to interact with NPC vendors.

**what it does not replace:** Real cooking or real trading. The ingredients are pre-selected and the vendors are tutorial NPCs.

---

## Graveflower Round

**activity_id:** `graveflower_round`

**player shorthand:** "the round"

**location:** Shrine Hearth to Gravegate and back.

**category:** Skilling Activity

**skills trained:** Favour, Gardening

**entry requirement:** Favour 1

**safe/risky/dangerous:** Safe

**loop description:** The player tends a circuit of grave flower patches between the Shrine Hearth and the Gravegate. Actions: plant seeds, water, prune weeds, light candles, and offer bone chips. Each patch has a growth state that must be maintained. Grave Mites occasionally disturb the patches and must be gently cleared.

**inputs:** Grave flower seeds (provided or purchased), water, candles.

**outputs:** Favour XP, Gardening XP, grave flowers, bone chips, Grave Token.

**reward identity:** Grave Tokens can be exchanged for grave flower seeds, candle trims, and the Gravekeeper ribbon cosmetic.

**failure state:** If a patch is neglected for too long, the flowers wilt and must be replanted. The wilted flowers are lost.

**what it teaches:** How to manage multiple timed tasks, how to use Favour rites, and how to garden in a sacred context.

**what it does not replace:** Real gardening or real Favour training. The patches are small and the loop is simplified.

---

## Foundry Shift

**activity_id:** `foundry_shift`

**player shorthand:** "the shift"

**location:** Foundry Row.

**category:** Production Activity

**skills trained:** Smithing, Mining

**entry requirement:** Smithing 1

**safe/risky/dangerous:** Safe

**loop description:** The player works a shift at the Foundry Row furnace. Actions: deliver ore carts from the stockpile, sort blackcoal into correct grades, repair the bellows, smelt timed batches of copper and tin, and hammer flawed ingots into usable bars. The furnace has a heat meter that must be managed. Overheating pauses production.

**inputs:** Copper ore, tin ore, blackcoal (provided or gathered).

**outputs:** Smithing XP, Mining XP, copper bars, tin bars, bronze rivets, Foundry Token.

**reward identity:** Foundry Tokens can be exchanged for repair discounts, smithing tools, and the Foundry Shift apron cosmetic.

**failure state:** If the furnace overheats, the current batch is ruined and the furnace must cool. The inputs are lost.

**what it teaches:** How to manage a timed production process, how to balance multiple inputs, and how to use a furnace.

**what it does not replace:** Real smithing or real mining. The ore is pre-provided and the batches are small. Real smithing happens at the anvil.

---

## Kilnwatch Primer

**activity_id:** `kilnwatch_primer`

**player shorthand:** "the primer"

**location:** Chalkhouse Court.

**category:** Production Activity

**skills trained:** Hearthcraft, Beadwork

**entry requirement:** Hearthcraft 1

**safe/risky/dangerous:** Safe

**loop description:** The player works a shift at the Chalkhouse Court bead kiln. Actions: gather bead clay or glass sand, fire beads at the kiln, sort fired beads by quality, and string them into primer strands. The kiln has a temperature curve that must be followed. Incorrect temperatures produce cracked beads.

**inputs:** Bead clay, glass sand (provided or gathered).

**outputs:** Hearthcraft XP, Beadwork XP, fired beads, primer strands, bead fragments, Kiln Token.

**reward identity:** Kiln Tokens can be exchanged for bead supplies, firing hints, and the Kilnwatch ribbon cosmetic.

**failure state:** If the kiln temperature is wrong, the batch cracks and the inputs are lost.

**what it teaches:** How to manage a temperature curve, how to sort by quality, and how to string beads.

**what it does not replace:** Real beadwork or real hearthcraft. The kiln is small and the batches are tutorial-sized.

---

## River Basket

**activity_id:** `river_basket`

**player shorthand:** "the basket"

**location:** River Stoop.

**category:** Skilling Activity

**skills trained:** Fishing, Cooking

**entry requirement:** Fishing 1

**safe/risky/dangerous:** Safe

**loop description:** The player fishes from the River Stoop using a provided basket. Actions: cast the basket, wait for a bite, haul the basket, sort the catch into edible and non-edible, and cook the edible fish on the Kitchen Range. The basket has a limited capacity. Overflowing the basket loses fish.

**inputs:** Fishing basket (provided), bait (provided or purchased).

**outputs:** Fishing XP, Cooking XP, raw fish, cooked fish, River Token.

**reward identity:** River Tokens can be exchanged for bait, fishing hints, and the River Basket ribbon cosmetic.

**failure state:** If the basket overflows, the excess fish are lost. If the player takes too long to cook, the raw fish spoil.

**what it teaches:** How to fish with a basket, how to sort catches, and how to cook under time pressure.

**what it does not replace:** Real fishing or real cooking. The basket is a tutorial tool and the fish are common species.

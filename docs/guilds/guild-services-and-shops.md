---
doc_type: authority
canonical_path: docs/guilds/guild-services-and-shops.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

Parent: [Guilds Index](00-index.md)

# Guild Services and Shops

This document lists every service, shop, and convenience that a guild may offer, what it explicitly may not offer, and which of the eight first-ring guilds provide what. For the guild system itself, see `docs/guilds/guild-system.md`. For the guilds that occupy the first ring, see `docs/guilds/first-ring-guilds.md`. For starter skill hubs, see `docs/guilds/starter-skill-hubs.md`. For the broader shop framework, see `docs/economy/shop-system.md`. For service pricing, see `docs/economy/services-and-fees.md`. For charters and permits, see `docs/ledger/charters-and-permits.md`. For stations, see `docs/tools-and-intermediates/stations.md`. For containers and pouches, see `docs/tools-and-intermediates/containers-and-pouches.md`.

---

## 1. Allowed Services

A guild may offer up to seven of the ten services below. No guild offers all ten. Each entry notes whether the service is a convenience (makes an existing activity faster or easier) or a unique feature (something the player cannot get elsewhere).

| service_id | name | what it does | example guild | type |
|---|---|---|---|---|
| nearby_bank_chest | Nearby bank chest / limited deposit box | A bank chest or a small deposit box within a few tiles of the guild's main activity. Deposits only; no full bank access. | foundry_hall | convenience |
| better_station | Better station | A faster furnace, a cleaner tanning frame, a more reliable anvil, or a kiln with reduced failure chance. Speed or reliability, not new recipes. | bellwood_yard | convenience |
| resource_cluster | Resource cluster | A denser patch of ore, higher-tier trees, or more fishing spots than the surrounding wilderness. | patchfield_tannery | convenience |
| specialist_shop | Specialist shop | Sells narrow consumables and parts: bow strings, fishing bait, blackcoal, empty phials, sewing needles. Stock is small and guild-themed. | wardenbrook_fishery | convenience |
| tool_repair | Tool repair | Repairs skill-specific tools on the spot for a small fee. Does not repair weapons or armour. | old_kiln_house | convenience |
| skill_tutor | Skill tutor | An NPC who explains mechanics, warns about failure states, and gives one-time starter tips. No XP rewards. | crowmile_road_camp | unique feature |
| contract_board | Contract board | A small set of local tasks (gather, deliver, craft) that rotate weekly. Rewards are modest. | sootstairs_rooms | unique feature |
| shortcut | Shortcut | A hidden path, ladder, or gate that leads to a related area faster than the main road. | wardenbrook_fishery | unique feature |
| storage | Storage | Supports a specific container type: ore sack, fish hamper, tool roll, or herb pouch. The container must still be crafted or earned. | foundry_hall | convenience |
| cosmetic_vendor | Cosmetic vendor | Sells aprons, tool trims, guild badges, and other non-stat appearance items. | bellwood_yard | unique feature |

---

## 2. What Guilds Do NOT Offer

The following are banned from all guilds. They break the balance between guild convenience and open-world exploration.

| banned_service_id | name | why it is banned |
|---|---|---|
| universal_best_in_slot | Universal best-in-slot equipment | Guilds are not the top source of gear. Best items come from crafting, drops, or quests. |
| global_xp_multiplier | Global XP multiplier | No flat bonus to all skill XP. That would make guild membership feel mandatory. |
| global_discount | Global discount | No percentage off all purchases. Guild shops are narrow, not cheaper. |
| mandatory_teleport_network | Mandatory teleport network | Teleports trivialize travel. A shortcut is fine; a network is not. |
| guild_only_recipes | Guild-only crafting recipes | Recipes must be discoverable in the open world. Locking them behind guild walls punishes solo players. |
| guild_only_skills | Guild-only skills | Every skill must be trainable without joining anything. |
| daily_reward_chests | Daily reward chests | No login rewards, no streak bonuses, no chests that accumulate while away. |

---

## 3. Service by Guild

This table shows which of the allowed services each first-ring guild provides. A checkmark means the guild offers that service in its main building or immediate yard.

| service | foundry_hall | bellwood_yard | patchfield_tannery | wardenbrook_fishery | lowgrave_chapel | old_kiln_house | sootstairs_rooms | crowmile_road_camp |
|---|---|---|---|---|---|---|---|---|
| nearby_bank_chest | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| better_station | ✓ (furnace) | ✓ (bow bench) | ✓ (tanning frame) | ✓ (cleaning table) | — | ✓ (kiln) | — | — |
| resource_cluster | ✓ (tinstone, pig_iron_ore, blackcoal, wardenstone) | ✓ (lathwood, bellmaple, bow_staves, feathers) | ✓ (rabbit_hide, fox_hide, sinew_cord, dye_plants) | ✓ (brook_trout, bell_herring, redback_salmon, river_curio) | ✓ (grave_dust, bone_chips, faint_bead, grave_ash) | ✓ (fire_clay, warm_scale, drake_tooth, bellmetal_ore) | ✓ (blackcoal_ash, blank_writ, wax_seal, stolen_coin_pouch) | ✓ (oldroad_oak, crow_feather, cart_iron_scrap, chalk_mark) |
| specialist_shop | ✓ | ✓ | ✓ | ✓ | ✓ (candles, offerings) | ✓ | — | — |
| tool_repair | ✓ | — | — | — | — | ✓ | — | — |
| skill_tutor | — | — | — | — | ✓ (favour) | — | — | ✓ (wayfaring, cartography) |
| contract_board | — | — | — | — | — | — | ✓ | ✓ |
| shortcut | — | — | — | ✓ (to river pool) | — | — | ✓ (to upper stair, risky routes) | ✓ (to road fork) |
| storage | ✓ (ore sack) | ✓ (woodpile) | ✓ (hide roll) | ✓ (fish hamper) | — | ✓ (tool roll) | ✓ (general hamper) | — |
| cosmetic_vendor | ✓ (foundry apron) | ✓ (axe mark) | ✓ (hide stamp) | ✓ (angler pin) | ✓ (candle trim) | ✓ (ashproof gloves) | ✓ (shadow cloak) | ✓ (road ribbon) |

Notes:

- `lowgrave_chapel` replaces `better_station` with a `shrine` (favour rites and cleanse). The shrine is treated as a station for counting purposes but is not a crafting station.
- `crowmile_road_camp` replaces `better_station` with a `campfire` (cooking and hearthcraft boost). The campfire is treated as a station for counting purposes.
- Every guild has at least one unique feature (`skill_tutor`, `contract_board`, `shortcut`, or `cosmetic_vendor`) so that no two guilds feel identical.

---

## 4. Shop Identity

Guild shops are not town shops. The difference is in scope, stock, and tone.

| aspect | town shop | guild shop |
|---|---|---|
| range | generalist. Sells a little of everything. | narrow. Sells one skill's consumables and parts. |
| stock size | large restocks, broad inventory. | small restocks, tight inventory. |
| pricing | standard market rates. | standard market rates. No guild discount. |
| NPC tone | merchant, neutral. | specialist, often a senior craftsperson who works that trade. |
| example | the general store in Old Town sells rope, tinderboxes, and basic food. | the foundry_hall specialist shop sells only blackcoal, iron nails, and tongs. |

A guild shop does not compete with the town general store. It fills gaps. A player who runs out of bait at the fishery should find bait there, not trek back to town.

---

## 5. Storage Support

Storage at a guild means the building supports a specific container type. The player must still craft or earn the container. The guild simply provides the hook, rack, or shelf that makes the container usable on site.

| guild | container_supported | what the storage point does |
|---|---|---|
| foundry_hall | ore_sack | A sack rack near the furnace. Lets the player dump ore directly from inventory into the sack without walking to a bank chest. |
| bellwood_yard | woodpile | A covered woodpile near the bow bench. Stores logs and bow staves in a dry stack. |
| patchfield_tannery | hide_roll | A hide rack near the tanning frame. Stores hides and leathers in a rolled bundle. |
| wardenbrook_fishery | fish_hamper | A wicker hamper near the cleaning table. Stores raw and cooked fish. |
| old_kiln_house | tool_roll | A pegboard near the kiln. Stores pottery tools, chisels, and moulds. |
| sootstairs_rooms | false_pouch | A small closet hamper with a hidden compartment. Stores small items only, but with more slots than a standard inventory. |

Storage points are not banks. They accept only the container they are built for, and they do not store gold, equipment, or quest items.

---

## 6. Deferred to Implementation

The following details are intentionally left out of this authority document. They will be set during content implementation and balancing.

| topic | what is deferred | where it will be decided |
|---|---|---|
| exact_shop_stock | The precise item list, quantities, and restock rates for each guild specialist shop. | `content/shops/` JSON and `docs/economy/shop-system.md` |
| exact_pricing | The exact coin cost for tool repair, cosmetic items, and contract rewards. | `docs/economy/services-and-fees.md` |
| storage_ui | The exact UI flow for depositing into and withdrawing from a guild storage point. | client implementation, guided by `docs/tools-and-intermediates/containers-and-pouches.md` |
| contract_details | The exact task types, completion conditions, and reward tables for contract boards. | `content/quests/` or `content/contracts/` JSON |
| shortcut_mechanics | Whether shortcuts require a skill level, a quest step, or just discovery. | `docs/guilds/first-ring-guilds.md` per-guild notes |
| cosmetic_range | The full catalogue of apron patterns, tool trims, and badge designs. | `content/cosmetics/` JSON |

*Last updated: 2026-05-31*

---
doc_type: audit
canonical_path: docs/content/runtime-gap-list.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

# Runtime Gap List

> **Prioritized implementation gap list for the Old Town vertical slice.** This is a runtime engineering backlog, not a design wishlist. Each item is classified by whether it blocks the basic playable vertical slice (P0), blocks Old Town identity (P1), or is later work (P2).

## P0 — Blocks Basic Vertical Slice

These gaps prevent a player from doing the core 30-minute loops. Without these, the game is not a game.

| # | Gap | Evidence | Impact | Est. Effort |
|---|-----|----------|--------|-------------|
| 1 | **NPC dialogue engine** | `intent-dispatcher.ts:130` emits "NPC interaction is not yet implemented" for all non-attack NPC actions. `ClientPacketApplier.ts:276` has `interfaceOpens` stub but no dialogue packet routing. | Blocks Loop A (quest givers), Loop G (all quests). Player cannot start any quest. | Medium |
| 2 | **Quest objective tracker and completion** | No quest state machine in server. No `quest` component in ECS. No quest progress packet in protocol. | Blocks Loop A, Loop G. Quests exist as JSON but have no runtime. | Medium |
| 3 | **Object non-skilling interaction routing** | `intent-dispatcher.ts:121` emits "Object interaction is not yet implemented" for all non-skilling object actions. `handleObjectSkillingIntent` only handles `woodcut`/`mine`/`chop`/`cook`/`use`. | Blocks Loop A (`pray`, `read`, `inspect`), Loop D (`tan`, `dye`), Loop E (`fire`, `weave`), Loop F (`fish`). | Small-Medium |
| 4 | **Spell effect application** | `spell-system.ts:140-217` validates and consumes beads but never applies `damage`, `bind`, `teleport`, `enchant`, or `alchemy` effects. No `applySpellEffect` function exists. | Blocks Loop E. Magic is a core identity. | Medium |
| 5 | **Bank / storage runtime** | `bank` action on NPCs and objects emits "not yet implemented." No bank inventory component, no bank UI packet, no deposit/withdraw logic. | Blocks Loop A. Banking is a core loop. | Medium |
| 6 | **Death + respawn for players** | `ground-item-system.ts:184-200` handles player death (sets `dead: true`) but no respawn logic, no death penalty, no respawn tile teleport. | Blocks Loop A. Players die permanently. | Small |
| 7 | **Shop / trade runtime** | `trade` action emits "not yet implemented." No shop stock schema, no transaction logic, no shop UI packet. | Blocks economy identity. Players cannot buy/sell. | Medium |

## P1 — Blocks Old Town Identity

These gaps are specific to Old Town's design. The game is playable without them, but it feels generic.

| # | Gap | Evidence | Impact | Est. Effort |
|---|-----|----------|--------|-------------|
| 8 | **Favour-lite offering action** | `pray` action on `shrine_hearth` emits "not yet implemented." `favour` skill exists. Items exist. No `offer`/`pray` handler in any system. | Blocks Favour progression. Sister Writ has no purpose. | Small |
| 9 | **Wardenry contract runtime** | Warden board has `read` option (unsupported). No contract schema, no contract acceptance, no contract objective tracking, no contract reward. | Blocks Warden Steps identity. Warden Holt has no purpose. | Medium |
| 10 | **Recipe UI / selection runtime** | `skilling-system.ts:320-324` auto-selects the first matching recipe. Player has no choice. No recipe selection packet exists. | Blocks meaningful crafting. Player cannot choose what to cook/smith. | Small |
| 11 | **Trapping action runtime** | `tan`, `dye`, `fire`, `weave`, `mix` are all unsupported. Trapping is not a skilling action in the current system. | Blocks Loop D. Patch Lane identity is weak. | Medium |
| 12 | **Teleport effect application** | `spell-system.ts` does not apply teleport destinations. `homeward_murmur` exists but does nothing. | Blocks `townstep` / `homeward_murmur`. | Small |
| 13 | **Fishing action support** | `fish` is not in `GATHER_ACTION_IDS`. No fishing-specific gather logic (no tool validation for fishing rods, no fish-specific success chance). | Blocks Loop F. River Stoop identity is weak. | Small |
| 14 | **Bind effect application** | `spell-system.ts` does not apply `bind` duration or movement lock. `bone_bind` exists but does nothing. | Blocks magic utility. | Small |
| 15 | **Map table / survey action** | `survey` action on `map_table` is unsupported. No cartography mechanic. | Blocks cartography identity. | Small |

## P2 — Later

These are deep Old Town systems that are not required for the first vertical slice.

| # | Gap | Evidence | Impact |
|---|-----|----------|--------|
| 16 | **Ledger deeds** | No ledger schema, no deed creation, no deed tracking. | Economic depth |
| 17 | **Oldroad Trails** | No trail schema, no trail discovery, no trail buff mechanics. | Exploration identity |
| 18 | **Nooks** | No nook schema, no hidden area discovery. | Exploration depth |
| 19 | **Charters / permits** | No charter schema, no permit gating. | Governance depth |
| 20 | **Public works** | No public work schema, no collective building. | Social depth |
| 21 | **Full Favour boons / oaths / rites** | Favour-lite is content-ready. Full system requires boon schemas, oath tracking, rite mechanics. | Religious identity |
| 22 | **Advanced status effects** | No poison, burn, freeze, or buff/debuff system beyond `bind`. | Combat depth |
| 23 | **Magic combat system** | Melee combat works. Magic combat requires spell damage application, magic defence rolls, magic XP. | Combat identity |
| 24 | **Equipment appearance system** | `ClientPacketApplier.ts:239-241` has `appearance` update but no equipment-to-appearance mapping. | Visual identity |
| 25 | **Drop table rarity / conditionals** | `rollDropTable` uses flat weight. No conditional drops (e.g., only if player has quest). | Loot depth |

---

## Quick Reference: What Works Right Now

These systems are **fully functional** and do not need immediate work:

- Movement (pathfinding, collision, facing)
- Melee combat (targeting, attack rolls, hit resolution, XP, health bars, hitsplats, death, drops, respawn)
- NPC AI (wander, aggro, chase, attack, return home, leash)
- Resource gathering (woodcut, mine — tool validation, success chance, XP, depletion, respawn)
- Processing (cook — recipe matching, input validation, failure chance, XP)
- Inventory (add, remove, equip, unequip, drop, examine)
- Consumables (eat, drink — heal delay, tick-phase application)
- Ground items (spawn, pickup, despawn, ownership)
- Chat (submit, broadcast, system messages)
- Spell validation (spellbook check, level check, cooldown, range, line of sight, bead cost)
- Map loading (4-region runtime, deterministic, tile overrides, collision)
- Interest management (entity spawning/removing based on player position)
- Tick loop (all 10 phases run correctly)

---

*Last updated: 2026-05-31*

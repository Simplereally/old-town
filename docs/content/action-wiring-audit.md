---
doc_type: audit
canonical_path: docs/content/action-wiring-audit.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

# Action ID and Interaction Wiring Audit

> **Audit date:** 2026-05-31  
> **Scope:** All action IDs declared in content JSON (`content/items/`, `content/objects/`, `content/npcs/`) and their runtime support in the server tick loop.  
> **Method:** Inspect `intent-dispatcher.ts`, `combat-system.ts`, `skilling-system.ts`, `ground-item-system.ts`, `item-actions.ts`, `spell-system.ts`, `npc-system.ts`, and `command-buffer.ts`.

## How to read this audit

- **Supported** — The server has a code path that handles this action ID and mutates authoritative state.
- **Partial** — The server accepts the command but does not fully apply the intended effect (e.g., beads are consumed but damage is not dealt).
- **Unsupported** — The server emits a system message like "NPC interaction is not yet implemented" and does nothing.
- **Unknown** — No explicit code path found; may fall through to a generic placeholder.

---

## NPC Action IDs

| Action ID | Source | Runtime support | Evidence | Notes |
|-----------|--------|-----------------|----------|-------|
| `attack` | `content/npcs/` (creatures) | **Supported** | `combat-system.ts:44` `ATTACK_ACTIONS` set, `intent-dispatcher.ts:127` routes to `handleNpcCombatIntent` | Full melee combat loop: target validation, pathing, attack scheduling, hit rolls, damage resolution, XP, death, drops, respawn. |
| `talk` | `content/npcs/` (service NPCs) | **Unsupported** | `intent-dispatcher.ts:130` | Emits "NPC interaction is not yet implemented." Dialogue content exists but no runtime dialogue engine. |
| `bank` | `content/npcs/` (Tomas Tally) | **Unsupported** | `intent-dispatcher.ts:130` | Emits "NPC interaction is not yet implemented." Bank counter object also has `bank` option — same gap. |
| `trade` | `content/npcs/` (service NPCs) | **Unsupported** | `intent-dispatcher.ts:130` | Emits "NPC interaction is not yet implemented." Shop/service stock schema is a gap. |

---

## Object Action IDs

| Action ID | Source | Runtime support | Evidence | Notes |
|-----------|--------|-----------------|----------|-------|
| `woodcut` | `content/objects/` (trees) | **Supported** | `skilling-system.ts:72` `GATHER_ACTION_IDS` | Full gather loop: tool validation, level check, success chance, XP, inventory delta, depletion, respawn. |
| `mine` | `content/objects/` (rocks) | **Supported** | `skilling-system.ts:72` `GATHER_ACTION_IDS` | Same gather loop as `woodcut`. |
| `chop` | `content/objects/` (trees) | **Supported** | `skilling-system.ts:72` `GATHER_ACTION_IDS` | Alias for `woodcut`; both accepted. |
| `cook` | `content/objects/` (stations) | **Supported** | `skilling-system.ts:73` `PROCESS_ACTION_IDS` | Full process loop: recipe matching, input validation, inventory delta, failure chance, XP. |
| `use` | `content/objects/` (stations) | **Supported** | `skilling-system.ts:73` `PROCESS_ACTION_IDS` | Generic process trigger; cooks first matching recipe. |
| `smelt` | `content/objects/` (furnace) | **Partial** | `skilling-system.ts:73` | Accepted as process action, but `furnace` object ID is not in `stationObjectIds` for any recipe. No `smelt` recipe exists in `processing-recipes/`. |
| `smith` | `content/objects/` (foundry_anvil) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." No smithing recipe runtime. |
| `craft` | `content/objects/` (lath_bow_bench) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." No craft recipe runtime. |
| `tan` | `content/objects/` (patch_tanning_frame) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `dye` | `content/objects/` (patch_dye_vat) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `fire` | `content/objects/` (chalkhouse_bead_kiln) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `weave` | `content/objects/` (chalkhouse_bead_loom) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `mix` | `content/objects/` (apothecary_bench) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `survey` | `content/objects/` (map_table) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `inspect` | `content/objects/` (quest objects) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." Quest objective progression not wired. |
| `read` | `content/objects/` (oldroad_signpost, rat_chewed_ledger, warden_board) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `enter` | `content/objects/` (gravegate_arch) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `ring` | `content/objects/` (market_bell) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." |
| `open` | `content/objects/` (doors, chests) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." Door/chest open mechanics not implemented. |
| `pray` | `content/objects/` (shrine_hearth) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." Favour offering not wired. |
| `bank` | `content/objects/` (counting_house_counter) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." Bank UI/storage not wired. |
| `trade` | `content/objects/` (shop counters) | **Unsupported** | `intent-dispatcher.ts:121` | Emits "Object interaction is not yet implemented." Shop/service stock schema is a gap. |

---

## Item Action IDs

| Action ID | Source | Runtime support | Evidence | Notes |
|-----------|--------|-----------------|----------|-------|
| `examine` | `content/items/` (all) | **Supported** | `item-actions.ts:94` | Emits examine text as system message. |
| `drop` | `content/items/` (all) | **Supported** | `item-actions.ts:100` | Removes from inventory, emits delta. |
| `equip` | `content/items/` (gear) | **Supported** | `item-actions.ts:108` `EQUIP_OPTIONS` | Validates equipment slot, moves inventory → equipment, emits deltas. |
| `wield` | `content/items/` (weapons) | **Supported** | `item-actions.ts:108` `EQUIP_OPTIONS` | Alias for `equip`. |
| `wear` | `content/items/` (armour) | **Supported** | `item-actions.ts:108` `EQUIP_OPTIONS` | Alias for `equip`. |
| `eat` | `content/items/` (food) | **Supported** | `item-actions.ts:123` `EAT_OPTIONS` | Validates consumable, applies eat delay, defers heal to `ConsumableSystem` tick phase. |
| `drink` | `content/items/` (potions) | **Supported** | `item-actions.ts:123` `EAT_OPTIONS` | Same as `eat`. |
| `use` | `content/items/` (all) | **Partial** | `item-actions.ts:151` | Emits "You need to use the X on something." No "use-on" target selection runtime. |
| `pickup` | Ground items | **Supported** | `ground-item-system.ts:31` | Full pickup: visibility check, tile check, inventory space, add item, destroy ground entity. |
| `take` | Ground items | **Supported** | `ground-item-system.ts:31` | Alias for `pickup`. |

---

## Spell Action IDs

| Action ID | Source | Runtime support | Evidence | Notes |
|-----------|--------|-----------------|----------|-------|
| `cast` | Spellbook UI → `CastSpellCommand` | **Partial** | `spell-system.ts:140` | Full validation: spellbook, magic level, cooldown, range, line of sight, bead cost. Beads are consumed. **Effect application is NOT implemented** — damage, bind, teleport, enchant, alchemy do not actually fire. |

---

## Summary Table

| Category | Supported | Partial | Unsupported |
|----------|-----------|---------|-------------|
| NPC | 1 (`attack`) | 0 | 3 (`talk`, `bank`, `trade`) |
| Object | 5 (`woodcut`, `mine`, `chop`, `cook`, `use`) | 1 (`smelt`) | 16 (`smith`, `craft`, `tan`, `dye`, `fire`, `weave`, `mix`, `survey`, `inspect`, `read`, `enter`, `ring`, `open`, `pray`, `bank`, `trade`) |
| Item | 7 (`examine`, `drop`, `equip`, `wield`, `wear`, `eat`, `drink`) | 1 (`use`) | 0 |
| Ground Item | 2 (`pickup`, `take`) | 0 | 0 |
| Spell | 0 | 1 (`cast`) | 0 |

**Total unique non-alias action IDs:** 30 (attack, talk, bank, trade, woodcut, mine, chop, cook, use, smelt, smith, craft, tan, dye, fire, weave, mix, survey, inspect, read, enter, ring, open, pray, examine, drop, equip, eat, drink, pickup, cast).

---

*Last updated: 2026-05-31*

# E45-S03 — Smithing, cooking, and crafting processing loops

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S02 (Woodcutting and Mining), E37-S01 (Recipe Selection Packet and UI), E37-S02 (Server-Side Recipe Selection Handler), E44-S04 (Skill Station Objects and Recipe Routing)
- Blocks: E45-S04, E45-S05

## Spec references

- `POC_SPEC.md` §15 (Skills and XP)
- `POC_SPEC.md` §15.6 (Gathering loop — pattern for processing)
- `POC_SPEC.md` §22 (UI system — recipe selection)
- `content/processing-recipes/` — recipes
- `docs/world/districts-and-routes.md` — station placement

## Objective

Connect the resource loop to processing. The player should be able to smelt ore into bars at the furnace, fletch logs into bows at the bow bench, cook fish at the kitchen range, tan hides at the tanning frame, and shape beads at the bead kiln. For POC, verify one core recipe per processing skill is wired and accessible in the first hour.

## What already exists (verify, do not rebuild)

- **Processing system:** `apps/server/src/systems/skilling-system.ts` implements the full processing loop: `handleProcessingIntent` routes `cook`/`smelt`/`smith`/`craft`/`tan`/`weave`/`fire`/`mix`/`use` actions, `validateProcessAction` checks range/level/inputs/inventory, `handleProcess` consumes inputs, rolls success/failure, produces outputs, and grants XP. Tests exist in `skilling-system.test.ts`.
- **Recipes already defined in `content/processing-recipes/`:**
  - `starter-smithing.json`: `smelt_pennywrought_ingot` (lvl 1, `penny_copper_ore` → `pennywrought_ingot`), `forge_pennywrought_shortblade` (lvl 5), `forge_pennywrought_helm` (lvl 5), `forge_pennywrought_ward` (lvl 5)
  - `starter-cooking.json`: `cook_raw_fish` (lvl 1, `raw_fish` → `cooked_fish`, burn → `burnt_fish`), `cook_ditch_shrimp_skewer` (lvl 1), `bake_bellbread` (lvl 1), `make_tinfin_pie` (lvl 15), `make_warden_ration` (lvl 10)
  - `starter-bowcraft.json`: `make_lathwood_arrows` (lvl 1, `dry_log` → `lathwood_arrows`), `make_lathwood_darts` (lvl 10), `make_lathwood_bow_stave` (lvl 5, `dry_log` → `lathwood_shortbow`)
  - `starter-tailoring.json`: `tan_rabbit_hide` (lvl 1, `rabbit_hide` → `soft_leather`)
  - `starter-beadwork.json`: `shape_bead_clay_blank` (lvl 1, `bead_clay` → `ember_bead`), `drill_basic_bead` (lvl 5), `fire_chalkmarked_bead` (lvl 10), `string_basic_bead_strand` (lvl 5), `make_threadbare_bead_pouch` (lvl 15)
- **Station objects in `content/objects/starter-objects.json`:** `foundry_furnace`, `foundry_anvil`, `cooking_range`, `market_kitchen_hearth`, `lath_bow_bench`, `patch_tanning_frame`, `chalkhouse_bead_kiln`, `chalkhouse_bead_loom` — all defined.
- **Supply chain fix applied:** `starter-bowcraft.json` level-1 and level-5 recipes now use `dry_log` (from level-1 trees) instead of `oldroad_oak_log` (from level-15 trees), making bowcraft accessible in the first hour.
- **Supply chain fix applied:** `river_perch_spot` fishing node (level 1, outputs `raw_fish`) added to `starter-nodes.json` and placed in `old-town-0-0-0.json` near River Stoop, closing the raw_fish supply chain.
- **Starter kit includes `small_net`** so the fishing loop is accessible from first load.

## Required work

This story is primarily a **verification and wiring** story. The processing engine and recipes are built; the work is verifying station placement, recipe routing, and client UI.

- [ ] **Verify station placements:** Confirm all processing stations are placed in the map near their associated districts:
  - Foundry Row: `foundry_furnace`, `foundry_anvil`
  - Lath Yard: `lath_bow_bench`
  - Patch Lane: `patch_tanning_frame`
  - Chalkhouse Court: `chalkhouse_bead_kiln`, `chalkhouse_bead_loom`
  - Market / River Stoop: `cooking_range`, `market_kitchen_hearth`
  Add missing station placements to the map if any are absent.
- [ ] **Verify recipe routing:** Each station object must route to the correct recipe group. The `stationObjectIds` field in each recipe defines which stations accept it. Verify the intent dispatcher routes `smelt`/`cook`/`craft`/`tan`/`fire` actions to the correct station-recipe combinations.
- [ ] **Verify burn/failure mechanics:** Cooking recipes have a `failureChance` (e.g., `cook_raw_fish` has 0.25). On failure, the recipe produces `failureItemId` (e.g., `burnt_fish`) instead of `successItemId`. Verify the processing handler rolls failure correctly and produces the burn item. This is a key cooking loop feature, not optional.
- [ ] **Verify beadwork loop:** `shape_bead_clay_blank` (lvl 1) converts `bead_clay` → `ember_bead` at `chalkhouse_bead_kiln`. The starter kit includes 20 each of `ember_bead`, `gust_bead`, `wit_bead`, `writ_bead` for testing the beadwork progression. Verify `bead_clay` is gatherable or purchasable so the loop is sustainable.
- [ ] **Verify recipe selection UI:** The client recipe selection panel (E37-S01) must list available recipes for the clicked station, filtered by the player's current skill level. Verify the UI opens on station click and sends the recipe selection to the server.
- [ ] Write test: smelting `penny_copper_ore` produces `pennywrought_ingot` and Smithing XP (verify exists in `skilling-system.test.ts`).
- [ ] Write test: cooking `raw_fish` produces `cooked_fish` on success and `burnt_fish` on failure, with Cooking XP on success.
- [ ] Write test: fletching `dry_log` produces `lathwood_arrows` and Bowcraft XP.
- [ ] Write test: tanning `rabbit_hide` produces `soft_leather` and Tailoring XP.

## POC recipe reference (level-1 only, first hour)

| Skill | Recipe ID | Input | Output | Station | Level |
|-------|-----------|-------|--------|---------|-------|
| smithing | `smelt_pennywrought_ingot` | `penny_copper_ore` | `pennywrought_ingot` | `foundry_furnace` | 1 |
| cooking | `cook_raw_fish` | `raw_fish` | `cooked_fish` (burn: `burnt_fish`) | `cooking_range`, `market_kitchen_hearth` | 1 |
| bowcraft | `make_lathwood_arrows` | `dry_log` | `lathwood_arrows` | `lath_bow_bench` | 1 |
| tailoring | `tan_rabbit_hide` | `rabbit_hide` | `soft_leather` | `patch_tanning_frame` | 1 |
| beadwork | `shape_bead_clay_blank` | `bead_clay` | `ember_bead` | `chalkhouse_bead_kiln` | 1 |

## Acceptance criteria

- [ ] Players can smelt `penny_copper_ore` into `pennywrought_ingot` at the foundry furnace.
- [ ] Players can cook `raw_fish` into `cooked_fish` at the kitchen range; burns produce `burnt_fish`.
- [ ] Players can fletch `dry_log` into `lathwood_arrows` at the bow bench.
- [ ] Players can tan `rabbit_hide` into `soft_leather` at the tanning frame.
- [ ] Players can shape `bead_clay` into `ember_bead` at the bead kiln.
- [ ] Processing consumes inputs and produces outputs server-side.
- [ ] Each processing action grants the correct skill XP.
- [ ] Recipe selection UI is wired to the server and filters by skill level.
- [ ] Stations enforce range and tool requirements.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — run one recipe at each station

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

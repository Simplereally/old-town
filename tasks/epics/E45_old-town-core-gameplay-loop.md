# E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E44 (Service NPCs and Economy Wiring), E09 (Skilling and Resource Node Loops), E10 (NPC AI, Combat, Death, Drops, and Respawn), E08 (Inventory, Equipment, Items, and Character Stats), E28 (Client UI and Visual Polish)
- Unlocks: E46 (Smoke Over Old Town Quest), E47 (Audio, Atmosphere, and UI Juice)

## Spec references

- `POC_SPEC.md` §2.3 (600 ms tick)
- `POC_SPEC.md` §9 (Server tick loop phase order)
- `POC_SPEC.md` §10 (Action queue system)
- `POC_SPEC.md` §13 (Combat system)
- `POC_SPEC.md` §15 (Skills and XP)
- `POC_SPEC.md` §22 (UI panels — inventory, skills, minimap, XP drops, hitsplats)
- `docs/areas/first-ring-areas.md` — starter region and first-ring progression
- `docs/world/starter-economy-loops.md` — first-hour loops
- `content/skills/` — skill definitions
- `content/resource-nodes/` — resource node definitions
- `content/npcs/` — creature definitions

## Epic goal

A new player should be able to spawn in Old Town, walk around, and within one hour experience the full MMO loop: gather resources, process them, fight creatures, bank loot, level up, and see other players doing the same. This epic ties together the movement, skilling, combat, inventory, equipment, and UI systems so the first hour is actually playable.

This is the "is it a game yet?" epic. It does not add new systems; it connects the existing systems with the starter-region content.

## Approach summary

1. **Starter spawn point.** Spawn the dev character at the Market Bell spawn point (tile 45,45 in `old-town-0-0-0.json`). The `DevSessionManager` already reads `playerSpawnPoints` from the region map and seeds a starter kit (`pennywrought_shortblade`, `pennywrought_axe`, `pennywrought_pickaxe`, `small_net`, `bread`, `raw_fish`, `coin`, beads) on first character creation. The main new work is wiring the client to open default UI panels on first `FullStatePacket`.
2. **Woodcutting and mining loops.** The gathering engine (`skilling-system.ts`) and resource node runtime (`resource-node-system.ts`) are already built. The starter region already has level-1 nodes (`dry_tree_node`, `scrub_tree`, `copper_rock_node`) placed. Add a `tin_rock_node` placement so tinstone is accessible in the starter region. Verify the client renders depleted node transforms.
3. **Processing loops.** The processing engine is already built. Recipes are defined for smithing (`smelt_pennywrought_ingot`), cooking (`cook_raw_fish` with burn mechanic), bowcraft (`make_lathwood_arrows` from `dry_log`), tailoring (`tan_rabbit_hide`), and beadwork (`shape_bead_clay_blank`). Supply chain fixes applied: bowcraft recipes now use `dry_log` (level-1 trees) instead of `oldroad_oak_log` (level-15 trees); `river_perch_spot` fishing node added for `raw_fish`. Verify station placements and recipe selection UI.
4. **Combat loop.** The combat engine is already built. `cellar_rat` (level 1, peaceful) is placed in `old-town-0-0-0.json`; `mud_goblin` (level 5, aggressive) is placed in `old-town-0-1-0.json`. Drop tables (`rat_drops`, `goblin_drops`) are defined. Verify combat flow, aggression behavior, drops, respawn, and client rendering of health bars/hitsplats.
5. **XP and level-ups.** The XP drop packet (`XpDropPacket`) and level-up detection (`AddXpResult.levelUp`) are already built. The genuinely new work is a structured `LevelUpPacket`, client skill panel wiring, level-up animation rendering, and derived stat recalculation on level-up.
6. **Integration smoke test.** Write an end-to-end test that spawns a character, walks to a tree, chops it, smelts the ore, kills a rat, and banks the loot — all via tick commands. This is owned by E45-S06.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E45/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E45-S01` — [Starter spawn point and first-load bootstrap](stories/E45/E45-S01_starter-spawn-point-and-first-load-bootstrap.md)
- [ ] `E45-S02` — [Woodcutting and mining loops in the starter region](stories/E45/E45-S02_woodcutting-and-mining-loops-in-the-starter-region.md)
- [ ] `E45-S03` — [Smithing, cooking, and crafting processing loops](stories/E45/E45-S03_smithing-cooking-and-crafting-processing-loops.md)
- [ ] `E45-S04` — [Combat loop against cellar rats and mud goblins](stories/E45/E45-S04_combat-loop-against-cellar-rats-and-mud-goblins.md)
- [ ] `E45-S05` — [XP drops, level-ups, and skill panel wiring](stories/E45/E45-S05_xp-drops-level-ups-and-skill-panel-wiring.md)
- [ ] `E45-S06` — [End-to-end integration smoke test](stories/E45/E45-S06_end-to-end-integration-smoke-test.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] A new player can spawn, walk around Old Town, and within an hour experience gather → process → fight → bank → level.
- [ ] Resource nodes deplete and respawn correctly on the 600 ms tick.
- [ ] Combat against cellar rats and mud goblins uses the attack/defence roll formula and shows hitsplats/XP.
- [ ] XP drops and level-ups are visible in the client.
- [ ] An automated end-to-end test exercises the first-hour loop (E45-S06).
- [ ] All actions remain server-authoritative; the client only sends intents and renders deltas.

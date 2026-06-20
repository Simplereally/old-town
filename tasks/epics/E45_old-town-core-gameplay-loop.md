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

1. **Starter spawn point.** Spawn the dev character at the Market Bell spawn trigger. On first spawn, give a cobbled shortblade and a few starter consumables. The spawn point is data-driven from the region map.
2. **Woodcutting and mining loops.** Place oldroad oak trees near Oldroad Gate and Lath Yard; place tinstone and pig iron ore nodes near North Quarry Road. Wire the axe and pickaxe tool requirements, success rolls, XP, depletion, and respawn. Show the resource node state (normal / depleted) in the client.
3. **Processing loops.** Wire the Counting House (none), Foundry Row (smelt ore → bars), Lath Yard (fletch logs → bows), Patch Lane (tan hides → leather), Chalkhouse Court (fire beads), and River Stoop (cook fish). For POC, implement the first recipe per station; more recipes are content work.
4. **Combat loop.** Place cellar rats in the Sootcellar and mud goblins on North Quarry Road. Wire the "Attack" option, target acquisition, melee timing, attack/defence rolls, hitsplats, death, drops, and ground items. Show health bars and hitsplats in the client.
5. **XP and level-ups.** Send skill XP deltas every tick. Render XP drops in the client. Trigger level-up events and broadcast the level-up graphic/overhead. Update the skill panel.
6. **Integration smoke test.** Write an end-to-end test that spawns a character, walks to a tree, chops it, smelts the ore, kills a rat, and banks the loot — all via tick commands.

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

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] A new player can spawn, walk around Old Town, and within an hour experience gather → process → fight → bank → level.
- [ ] Resource nodes deplete and respawn correctly on the 600 ms tick.
- [ ] Combat against cellar rats and mud goblins uses the attack/defence roll formula and shows hitsplats/XP.
- [ ] XP drops and level-ups are visible in the client.
- [ ] An automated end-to-end test exercises the first-hour loop.
- [ ] All actions remain server-authoritative; the client only sends intents and renders deltas.

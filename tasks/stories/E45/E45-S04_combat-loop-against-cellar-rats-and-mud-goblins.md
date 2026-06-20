# E45-S04 — Combat loop against cellar rats and mud goblins

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S03 (Processing Loops), E10-S03 (Melee Attack Timing and Rolls), E10-S04 (Apply Hits, Health Bars, Hitsplats, and XP), E10-S05 (Death, Drops, Ground Items, and Ownership)
- Blocks: E45-S05

## Spec references

- `POC_SPEC.md` §13 (Combat system)
- `POC_SPEC.md` §13.4 (Hit chance formula)
- `POC_SPEC.md` §13.5 (Damage)
- `POC_SPEC.md` §14.3 (NPC rules — spawn, wander, leash, respawn)
- `content/npcs/` — creature definitions
- `content/drops/` — drop tables
- `docs/areas/first-ring-areas.md` — starter creatures

## Objective

Place starter combat creatures and wire the full combat loop. The player should be able to attack a cellar rat or mud goblin, see the attack animation, hitsplat, health bar, XP drop, death, and loot.

## Required architectural decisions

- **Creature placement:**
  - Sootcellar: `cellar_rat` (combat level 1-2, weak melee)
  - North Quarry Road: `mud_goblin` (combat level 3-5, slightly stronger)
- **Combat flow:** Player selects "Attack" → path to melee range → start combat → attack every `attackSpeedTicks` → roll hit → apply damage → show hitsplat → grant XP on death → drop loot.
- **Auto-retaliate:** Creatures auto-retaliate when struck. They do not initially aggro unless attacked (starter-friendly).
- **Death and drops:** On death, the creature drops a loot table roll (coins, bones, raw meat). The killer gets private visibility for 60 ticks, then public.
- **Respawn:** Creatures respawn at their home tile after `respawnTicks`.
- **XP distribution:** Combat XP is split to Attack, Strength, Defence, and Hitpoints based on the active combat style.

## Implementation checklist

- [ ] Place cellar rat and mud goblin spawns in the starter map.
- [ ] Verify creature definitions and drop tables in `content/npcs/` and `content/drops/`.
- [ ] Wire the "Attack" NPC option to the combat system.
- [ ] Implement auto-retaliate for starter creatures.
- [ ] Implement death, drops, and ground item ownership.
- [ ] Implement respawn at home tile.
- [ ] Add health bars and hitsplats to the client renderer.
- [ ] Write test: attacking a rat reduces its HP and shows hitsplats.
- [ ] Write test: killing a rat grants combat XP and drops loot.
- [ ] Write test: a killed creature respawns after its respawn ticks.

## Acceptance criteria

- [ ] Players can attack cellar rats and mud goblins.
- [ ] Combat uses attack/defence rolls and shows hitsplats.
- [ ] Creatures auto-retaliate and die when HP reaches zero.
- [ ] Death produces ground items with ownership timing.
- [ ] Respawn happens at the creature's home tile.
- [ ] Combat XP is distributed correctly.
- [ ] Health bars and hitsplats are visible in the client.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — kill a rat and a goblin

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

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
- `content/npcs/starter-npcs.json` — creature definitions
- `content/drops/starter-drops.json` — drop tables
- `docs/areas/first-ring-areas.md` — starter creatures

## Objective

Verify and wire the full combat loop against starter creatures. The player should be able to attack a cellar rat or mud goblin, see the attack animation, hitsplat, health bar, XP drop, death, and loot.

## What already exists (verify, do not rebuild)

- **Combat system:** `apps/server/src/systems/combat-system.ts` implements melee attack timing, hit/damage rolls (§13.4/§13.5), combat style selection (`combatStyle` component, `allowedStyles` from weapon), and XP distribution. Tests exist.
- **Death, drops, ground items:** E10-S05 implemented death, drop table rolls, ground item spawning with ownership/visibility timing, and respawn at home tile.
- **Creature placements already in maps:**
  - `cellar_rat` spawns in `old-town-0-0-0.json` (Sootcellar area): 6 spawns at tiles (28,28), (30,30), (32,28), (34,30), (36,28), and more.
  - `mud_goblin` spawns in `old-town-0-1-0.json` (North Quarry Road area): 4 spawns at tiles (44,12), (48,12), (50,16), (52,14).
- **Creature definitions in `content/npcs/starter-npcs.json`:**
  - `cellar_rat`: combat level 1, `aggressionMode: "peaceful"`, does not aggro or retaliate. Drop table: `rat_drops`.
  - `mud_goblin`: combat level 5, `aggressionMode: "aggressive"`, `aggressiveRadius: 3`. Drop table: `goblin_drops`.
- **Drop tables in `content/drops/starter-drops.json`:**
  - `rat_drops`: always drops `smoke_over_old_town_cellar_rat_tail` ×1; chance of `coin` (1-2) and `bread` (1).
  - `goblin_drops`: always drops `coin` ×3; chance of `bread` (1), `copper_ore` (1-2), and rare `pennywrought_cudgel` (1).
- **Player auto-retaliate:** The player's `combatant` component has `autoRetaliate: true` by default (set in `dev-session.ts`).

## Required work

This story is primarily a **verification and client-wiring** story. The combat engine is built; the work is verifying the loop works end-to-end and the client renders combat feedback.

- [ ] **Verify combat flow:** Player selects "Attack" on a creature → server paths to melee range → combat starts → attacks every `attackSpeedTicks` → hit roll → damage → hitsplat delta → XP on hit → death at 0 HP → drop table roll → ground items with ownership → respawn timer.
- [ ] **Verify creature aggression behavior:**
  - `cellar_rat` is `peaceful` — it does not aggro and does not retaliate. Players can attack it freely without being attacked back. This is the safe starter combat target.
  - `mud_goblin` is `aggressive` with radius 3 — it will attack players within 3 tiles unprovoked. This is a step up in danger. Players must be prepared before approaching North Quarry Road.
  - Do **not** change these aggression modes — they are intentional content design. The story's original claim that goblins "do not initially aggro" was incorrect.
- [ ] **Verify drop table rolls:** On creature death, the server rolls the drop table and spawns ground items. Verify:
  - `cellar_rat` death → `smoke_over_old_town_cellar_rat_tail` always + chance of coin/bread.
  - `mud_goblin` death → `coin` ×3 always + chance of bread/copper_ore/cudgel.
  - The original story's claim of "bones" and "raw meat" drops was incorrect — neither item is in these drop tables.
- [ ] **Verify respawn:** Creatures respawn at their home tile after `respawnTicks` (defined per NPC in `starter-npcs.json`).
- [ ] **Verify client rendering:** The client must render health bars above creatures, hitsplat animations on hit, and ground items on death. Verify the client applies `hitsplats` deltas and `healthBar` entity updates.
- [ ] **Verify combat XP distribution:** Combat XP is split to Attack/Strength/Defence/Hitpoints based on the player's active `combatStyle` (already implemented in `combat-system.ts`). The `pennywrought_shortblade` supports `stab`, `slash`, and `crush` styles. Verify XP is awarded correctly per style.
- [ ] Write test: attacking a `cellar_rat` reduces its HP and generates hitsplat deltas (verify exists in combat tests).
- [ ] Write test: killing a `cellar_rat` grants combat XP and drops `rat_drops` loot.
- [ ] Write test: killing a `mud_goblin` drops `goblin_drops` loot.
- [ ] Write test: a killed creature respawns after its `respawnTicks`.

## Creature reference

| Creature | Combat Level | Aggression | Region | Drop Table | Key Drops |
|----------|-------------|------------|--------|------------|-----------|
| `cellar_rat` | 1 | peaceful | 0-0-0 (Sootcellar) | `rat_drops` | `cellar_rat_tail` (always), coin, bread |
| `mud_goblin` | 5 | aggressive (r=3) | 0-1-0 (N. Quarry Rd) | `goblin_drops` | coin ×3 (always), bread, copper_ore, pennywrought_cudgel (rare) |

## Acceptance criteria

- [ ] Players can attack `cellar_rat` and `mud_goblin` via the "Attack" NPC option.
- [ ] Combat uses attack/defence rolls (§13.4/§13.5) and shows hitsplats.
- [ ] `cellar_rat` does not retaliate (peaceful); `mud_goblin` aggros within radius 3 (aggressive).
- [ ] Creature death produces ground items from the correct drop table with ownership timing.
- [ ] Respawn happens at the creature's home tile after `respawnTicks`.
- [ ] Combat XP is distributed to the correct skill based on the player's active combat style.
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

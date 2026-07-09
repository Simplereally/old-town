# E45-S01 — Starter spawn point and first-load bootstrap

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E44-S05 (Warden Board and Shrine Activities), E17-S02 (Add Player Spawn and Respawn to Region Map), E05-S02 (Dev Character Session Bootstrap)
- Blocks: E45-S02, E45-S03, E45-S04, E45-S05

## Spec references

- `POC_SPEC.md` §2.1 (Server is truth — spawn position)
- `POC_SPEC.md` §20.1 (Persistence — `characters` table)
- `POC_SPEC.md` §22 (UI system — inventory, equipment, skills panels)
- `content/maps/old-town-0-0-0.json` — player spawn (`playerSpawnPoints`, `spawnType: "default"`)

## Objective

Set the Market Bell as the canonical starter spawn point. When a dev character is created or logs in, it spawns at the Market Bell with starter equipment and a small inventory of consumables. The first-load bootstrap must also open the default UI panels (inventory, skills, minimap, chat).

## What already exists (verify, do not rebuild)

The following were implemented in prior epics and are shipped:

- **`DevSessionManager`** (`apps/server/src/net/dev-session.ts`) already reads `playerSpawnPoints` from the runtime map, resolves `spawnType: "default"` or `"new_player"`, and falls back to `DEV_SPAWN_TILE` if none found.
- **`STARTER_ITEMS`** constant already seeds inventory with `pennywrought_shortblade`, `pennywrought_axe`, `pennywrought_pickaxe`, `small_net`, `bread` ×5, `raw_fish` ×5, `coin` ×25, and bead items.
- **`autoEquipStarterWeapon`** already moves the `pennywrought_shortblade` from inventory to the weapon equipment slot and recalculates bonuses.
- **`applyDefaultPlayerComponents`** already sets position, player, actor, movement, inventory, equipment, bank, vars, skills (all level 1), and combatant components.
- **Persistence:** `createPlayer` loads a character snapshot from `PersistenceAdapter`. If a snapshot exists, `applyCharacterSnapshot` overrides the default components. Starter items are only audited when `snapshot === undefined` (first creation). This means the starter kit is granted once on first character creation, not on every login — preventing dupe exploits.
- **Full state packet:** `fullState()` already sends inventory, bank, equipment, skills, vars, combatStyle, and regionLoads.
- **Map spawn:** `content/maps/old-town-0-0-0.json` already defines `playerSpawnPoints` at tile (45, 45, 0) with `spawnType: "default"`, and a `deathRespawnPoints` at (34, 46, 0).
- **Tests:** `dev-session.test.ts` already verifies spawn position, inventory contents, equipment, skills, region loads, and persistence round-trip.

## Required work

This story is primarily a **verification and gap-filling** story, not a greenfield build.

- [X] Verify the spawn point at tile (45, 45) in `old-town-0-0-0.json` corresponds to the Market Bell area. If the Market Bell trigger zone (`player_spawn_market_bell` at x46, y46) is the intended spawn, confirm the spawn point is inside or adjacent to it. Adjust the `playerSpawnPoints` coordinates if needed.
- [X] Verify the starter inventory in `STARTER_ITEMS` matches the intended first-hour experience. The current kit includes weapon, axe, pickaxe, small_net, food, coins, and beads — sufficient for all E45 loops.
- [X] **UI panel opening:** The server sends `FullStatePacket` with all component data. The client must open default panels (inventory, skills, chat) after receiving the first `FullStatePacket`. This is the main new work: wire the client `GameEngine` to open panels on first state. The minimap is always visible per §22.1.
- [X] Write test: verify a new dev character spawns at the Market Bell tile (currently (45, 45)).
- [X] Write test: verify the starter inventory contains the expected items (already exists in `dev-session.test.ts` — update if item list changed).
- [X] Write test: verify the `pennywrought_shortblade` is equipped in the weapon slot (already exists).
- [X] Write test: verify the client opens default UI panels on first `FullStatePacket` receipt.

## Acceptance criteria

- [X] New dev characters spawn at the Market Bell.
- [X] Starter inventory and equipment are set correctly on first character creation only (not re-granted on reconnect).
- [X] Default UI panels (inventory, skills, chat) open on first load. Minimap is always visible.
- [X] Spawn position is server-authoritative and read from the region map `playerSpawnPoints`.
- [X] No hardcoded spawn coordinates in the client or session code (only the `DEV_SPAWN_TILE` fallback in `dev-session.ts`).

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — create a new dev character and verify spawn position and open panels

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

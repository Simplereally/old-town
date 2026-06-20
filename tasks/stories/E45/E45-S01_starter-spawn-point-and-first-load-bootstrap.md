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
- `scripts/generate-old-town-map.ts` — spawn triggers
- `content/maps/old-town-0-0-0.json` — player spawn

## Objective

Set the Market Bell as the canonical starter spawn point. When a dev character is created or logs in, it spawns at the Market Bell with starter equipment and a small inventory of consumables. The first-load bootstrap must also open the default UI panels (inventory, skills, minimap, chat).

## Required architectural decisions

- **Spawn source of truth:** The spawn point is defined in the region map (`player_spawn_market_bell` trigger). The server reads this on session bootstrap.
- **Starter inventory:** Give the player:
  - `cobbled_shortblade` (weapon)
  - `bread` × 5
  - `health_potion` × 3
  - `coins` × 25
- **Equipment bootstrap:** Auto-equip the cobbled shortblade into the weapon slot.
- **UI panels:** On first spawn, the client opens inventory, skills, and chat panels. The minimap is always visible.
- **Dev character:** The dev character system (E05-S02) is reused; no account system is required for POC.

## Implementation checklist

- [ ] Read the spawn point from the region map on session bootstrap.
- [ ] Implement the starter inventory and equipment setup.
- [ ] Send the initial full state to the client including inventory, equipment, skills, and position.
- [ ] Open default UI panels on the client after receiving the first full state.
- [ ] Write test: a new dev character spawns at the Market Bell.
- [ ] Write test: the starter inventory contains the expected items.
- [ ] Write test: the cobbled shortblade is equipped in the weapon slot.
- [ ] Write test: the client receives the initial full state and opens default panels.

## Acceptance criteria

- [ ] New dev characters spawn at the Market Bell.
- [ ] Starter inventory and equipment are set correctly.
- [ ] Default UI panels open on first load.
- [ ] Spawn position is server-authoritative and read from the region map.
- [ ] No hardcoded spawn coordinates in the client or session code.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — create a new dev character and verify spawn

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E24-S01 — Player Death State and Respawn Logic

## Epic

E24 — Player Death and Respawn

## Dependency chain

- Depends on: E10-S05
- Blocks: E24-S02

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 6)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §10 (Combat & Death)

## Objective

Implement player death state handling and respawn logic. When a player dies, trigger respawn after a delay, teleport to respawn point, and restore health.

## Implementation checklist

- [X] Write a failing test for player death and respawn in `apps/server/src/systems/__tests__/player-death.test.ts`.
- [X] Extend `ground-item-system.ts` (or create `death-system.ts`) with player respawn logic.
- [X] Implement death state: set `dead: true`, start respawn timer (e.g., 5 ticks).
- [X] Implement respawn: on timer expiry, teleport to respawn tile, restore health to max, set `dead: false`.
- [X] Load respawn point from region map spawn point or default.
- [X] Send death and respawn packets to client.
- [X] Write a passing test for player death state.
- [X] Write a passing test for respawn timer.
- [X] Write a passing test for respawn teleport.
- [X] Write a passing test for health restoration on respawn.

## Acceptance criteria

- [X] Player death triggers respawn timer.
- [X] Respawn teleports player to respawn point and restores health.
- [X] Death and respawn packets are sent to client.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E24/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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

- [ ] Write a failing test for player death and respawn in `apps/server/src/systems/__tests__/player-death.test.ts`.
- [ ] Extend `ground-item-system.ts` (or create `death-system.ts`) with player respawn logic.
- [ ] Implement death state: set `dead: true`, start respawn timer (e.g., 5 ticks).
- [ ] Implement respawn: on timer expiry, teleport to respawn tile, restore health to max, set `dead: false`.
- [ ] Load respawn point from region map spawn point or default.
- [ ] Send death and respawn packets to client.
- [ ] Write a passing test for player death state.
- [ ] Write a passing test for respawn timer.
- [ ] Write a passing test for respawn teleport.
- [ ] Write a passing test for health restoration on respawn.

## Acceptance criteria

- [ ] Player death triggers respawn timer.
- [ ] Respawn teleports player to respawn point and restores health.
- [ ] Death and respawn packets are sent to client.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E24/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

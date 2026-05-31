# E24-S02 — Death Penalty and Grave System

## Epic

E24 — Player Death and Respawn

## Dependency chain

- Depends on: E24-S01
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 6)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §10 (Combat & Death)

## Objective

Implement death penalty and grave system. On death, drop some/all items on the ground in a grave that persists for a limited time.

## Implementation checklist

- [X] Write a failing test for death penalty in `apps/server/src/systems/__tests__/death-penalty.test.ts`.
- [X] Implement death penalty: drop all items (or keep 3 best, drop rest) on ground.
- [X] Create grave container: tagged ground items with owner and expiry timer.
- [X] Implement grave expiry: despawn after N ticks (e.g., 300 ticks = 3 minutes).
- [X] Implement item reclaim: player can pick up grave items without ownership check.
- [X] Send grave location and timer to client.
- [X] Write a passing test for item drop on death.
- [X] Write a passing test for grave creation.
- [X] Write a passing test for grave expiry.
- [X] Write a passing test for item reclaim.

## Acceptance criteria

- [X] Death penalty drops items correctly.
- [X] Grave container is created with owner and expiry.
- [X] Grave items can be reclaimed by owner.
- [X] Grave expires after timer.
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

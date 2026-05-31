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

- [ ] Write a failing test for death penalty in `apps/server/src/systems/__tests__/death-penalty.test.ts`.
- [ ] Implement death penalty: drop all items (or keep 3 best, drop rest) on ground.
- [ ] Create grave container: tagged ground items with owner and expiry timer.
- [ ] Implement grave expiry: despawn after N ticks (e.g., 300 ticks = 3 minutes).
- [ ] Implement item reclaim: player can pick up grave items without ownership check.
- [ ] Send grave location and timer to client.
- [ ] Write a passing test for item drop on death.
- [ ] Write a passing test for grave creation.
- [ ] Write a passing test for grave expiry.
- [ ] Write a passing test for item reclaim.

## Acceptance criteria

- [ ] Death penalty drops items correctly.
- [ ] Grave container is created with owner and expiry.
- [ ] Grave items can be reclaimed by owner.
- [ ] Grave expires after timer.
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

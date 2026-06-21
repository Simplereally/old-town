# E23-S02 — Apply Bind and Teleport Effects

## Epic

E23 — Spell Effects and Magic Combat

## Dependency chain

- Depends on: E23-S01
- Blocks: E23-S03

## Spec references

- docs/content/runtime-gap-list.md (P1 gaps 12, 14)
- docs/content/action-wiring-audit.md (action IDs: `cast`, `teleport`)
- POC_SPEC.md §11 (Magic & Spells)

## Objective

Implement bind and teleport spell effects. Apply bind duration and movement lock to targets, and apply teleport destination to players.

## Implementation checklist

- [X] Write a failing test for bind and teleport effects in `apps/server/src/systems/__tests__/spell-effects.test.ts`.
- [X] Extend `spell-system.ts` with bind effect application.
- [X] Implement bind: set `bindDuration` ticks on target, block movement for duration.
- [X] Extend `spell-system.ts` with teleport effect application.
- [X] Implement teleport: validate destination, move player to destination tile, send teleport packet.
- [X] Handle `homeward_murmur` teleport to spawn point.
- [X] Write a passing test for bind application.
- [X] Write a passing test for bind movement block.
- [X] Write a passing test for teleport application.
- [X] Write a passing test for `homeward_murmur` to spawn point.

## Acceptance criteria

- [X] Bind effect sets duration and blocks movement.
- [X] Teleport effect moves player to valid destination.
- [X] `homeward_murmur` teleports to player spawn point.
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
- [X] Move this story file to `tasks/completed/stories/E23/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E30-S04 — Charters and Permits

## Epic

E30 — World Expansion Systems

## Dependency chain

- Depends on: E30-S03
- Blocks: E30-S05

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 19)
- docs/world/charters.md

## Objective

Implement the Charters and permits system. Players can obtain permits that gate access to areas, activities, or content.

## Implementation checklist

- [X] Write a failing test for charters in `apps/server/src/systems/__tests__/charters.test.ts`.
- [X] Create `charter-system.ts` in `apps/server/src/systems/`.
- [X] Define charter schema: `id`, `name`, `type` (`area`, `activity`, `content`), `requiredStanding`, `cost`, `duration`.
- [X] Implement charter issuance: validate standing, deduct cost, grant permit.
- [X] Implement charter validation: check permit before gated action.
- [X] Implement charter expiry: remove permit after duration.
- [X] Write a passing test for charter issuance.
- [X] Write a passing test for charter validation.
- [X] Write a passing test for charter expiry.
- [X] Write a passing test for charter cost deduction.

## Acceptance criteria

- [X] Charters are issued with validation.
- [X] Charter validation gates access correctly.
- [X] Charter expiry removes permits.
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
- [X] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

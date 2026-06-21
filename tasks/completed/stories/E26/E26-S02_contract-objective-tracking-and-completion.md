# E26-S02 — Contract Objective Tracking and Completion

## Epic

E26 — Wardenry Contracts

## Dependency chain

- Depends on: E26-S01
- Blocks: E26-S03

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 9)
- docs/content/action-wiring-audit.md
- docs/wardenry/contract-system.md

## Objective

Implement contract objective tracking and completion detection. Track progress on contract objectives (gather, kill, deliver, escort) and detect when all objectives are satisfied.

## Implementation checklist

- [X] Write a failing test for contract objective tracking in `apps/server/src/systems/__tests__/contract-objectives.test.ts`.
- [X] Extend `contract-system.ts` with objective tracking.
- [X] Implement objective types: `gather`, `kill`, `deliver`, `escort`, `survey`.
- [X] Update objective progress on relevant events (same pattern as quest objectives).
- [X] Implement contract completion detection: all objectives satisfied → status `completed`.
- [X] Send contract update packet to client on progress.
- [X] Write a passing test for gather objective.
- [X] Write a passing test for kill objective.
- [X] Write a passing test for deliver objective.
- [X] Write a passing test for contract completion detection.

## Acceptance criteria

- [X] All contract objective types are tracked.
- [X] Progress updates are sent to client.
- [X] Contract completion is detected automatically.
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
- [X] Move this story file to `tasks/completed/stories/E26/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

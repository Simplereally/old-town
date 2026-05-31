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

- [ ] Write a failing test for contract objective tracking in `apps/server/src/systems/__tests__/contract-objectives.test.ts`.
- [ ] Extend `contract-system.ts` with objective tracking.
- [ ] Implement objective types: `gather`, `kill`, `deliver`, `escort`, `survey`.
- [ ] Update objective progress on relevant events (same pattern as quest objectives).
- [ ] Implement contract completion detection: all objectives satisfied → status `completed`.
- [ ] Send contract update packet to client on progress.
- [ ] Write a passing test for gather objective.
- [ ] Write a passing test for kill objective.
- [ ] Write a passing test for deliver objective.
- [ ] Write a passing test for contract completion detection.

## Acceptance criteria

- [ ] All contract objective types are tracked.
- [ ] Progress updates are sent to client.
- [ ] Contract completion is detected automatically.
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
- [ ] Move this story file to `tasks/completed/stories/E26/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

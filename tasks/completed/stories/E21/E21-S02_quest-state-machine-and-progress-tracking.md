# E21-S02 — Quest State Machine and Progress Tracking

## Epic

E21 — NPC Dialogue and Quest Engine

## Dependency chain

- Depends on: E21-S01
- Blocks: E21-S03

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 2)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §12 (Dialogue & Quests)

## Objective

Implement the quest state machine and objective tracker so that quests can be started, progressed, and have their objectives evaluated each tick. Create a `quest` ECS component and wire it into the tick loop.

## Implementation checklist

- [X] Write a failing test for quest state machine in `apps/server/src/systems/__tests__/quest.test.ts`.
- [X] Create `quest-system.ts` in `apps/server/src/systems/`.
- [X] Define `quest` ECS component with fields: `questId`, `status` (`not_started`, `in_progress`, `completed`), `objectives` (array of progress), `startTick`.
- [X] Implement quest start: validate requirements, create quest component, set status to `in_progress`.
- [X] Implement objective progress tracking: update counters on relevant events (gather, kill, talk, etc.).
- [X] Implement objective evaluation each tick: check if all objectives are satisfied.
- [X] Write a passing test for quest start and objective tracking.
- [X] Write a passing test for quest progress update on gather event.
- [X] Write a passing test for quest progress update on kill event.
- [X] Write a passing test for quest completion detection.

## Acceptance criteria

- [X] Quest state machine exists and handles `not_started` → `in_progress` → `completed`.
- [X] Objective progress is tracked per quest and updated on relevant events.
- [X] Quest completion is detected automatically when all objectives are satisfied.
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
- [X] Move this story file to `tasks/completed/stories/E21/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

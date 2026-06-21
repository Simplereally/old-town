# E21-S03 — Quest Completion and Reward Application

## Epic

E21 — NPC Dialogue and Quest Engine

## Dependency chain

- Depends on: E21-S02
- Blocks: E21-S04

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 2)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §12 (Dialogue & Quests)

## Objective

Implement quest completion handling and reward application. When a quest is completed, apply rewards (XP, items, favour, reputation) atomically and update the player's quest state.

## Implementation checklist

- [X] Write a failing test for quest completion in `apps/server/src/systems/__tests__/quest-completion.test.ts`.
- [X] Extend `quest-system.ts` with quest completion logic.
- [X] Implement reward application: XP, items, favour, reputation, unlocks.
- [X] Ensure reward application is atomic (all or nothing within a tick).
- [X] Handle quest completion via NPC dialogue (`quest_complete` node) and auto-completion.
- [X] Send quest completion packet to client for UI feedback.
- [X] Write a passing test for full reward application.
- [X] Write a passing test for partial reward failure (inventory full).
- [X] Write a passing test for quest completion via dialogue.
- [X] Write a passing test for quest completion persistence.

## Acceptance criteria

- [X] Quest completion applies all rewards atomically.
- [X] Rewards are validated before application (inventory space, level caps, etc.).
- [X] Quest completion is sent to client for UI feedback.
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

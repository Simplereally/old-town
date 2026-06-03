# E25-S03 — Fishing Action Support

## Epic

E25 — Object Interaction and Content Routing

## Dependency chain

- Depends on: E25-S02
- Blocks: E25-S04

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 13)
- docs/content/action-wiring-audit.md (action IDs: `fish`)
- POC_SPEC.md §9 (Skilling & Objects)

## Objective

Implement fishing action support. Add `fish` to the gathering system with tool validation (fishing rod), fish-specific success chance, and fishing spot depletion.

## Implementation checklist

- [X] Write a failing test for fishing in `apps/server/src/systems/__tests__/fishing.test.ts`.
- [X] Add `fish` to `GATHER_ACTION_IDS` in skilling system.
- [X] Implement fishing tool validation: player must have fishing rod equipped or in inventory.
- [X] Implement fish-specific success chance based on fishing level and fish difficulty.
- [X] Implement fishing spot depletion: chance to deplete after successful catch, respawn after N ticks.
- [X] Award fishing XP on successful catch.
- [X] Write a passing test for fishing tool validation.
- [X] Write a passing test for fishing success chance.
- [X] Write a passing test for fishing spot depletion.
- [X] Write a passing test for fishing XP award.

## Acceptance criteria

- [X] `fish` action is handled by the gathering system.
- [X] Fishing tool validation works.
- [X] Fish-specific success chance is calculated.
- [X] Fishing spots deplete and respawn.
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
- [X] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

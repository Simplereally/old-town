# E25-S01 — Object Non-Skilling Interaction Router

## Epic

E25 — Object Interaction and Content Routing

## Dependency chain

- Depends on: E09
- Blocks: E25-S02, E25-S03, E25-S04, E25-S05

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 3)
- docs/content/action-wiring-audit.md (action IDs: `pray`, `read`, `inspect`, `fire`, `weave`)
- POC_SPEC.md §9 (Skilling & Objects)

## Objective

Implement the object non-skilling interaction router. Currently `handleObjectSkillingIntent` only handles `woodcut`, `mine`, `chop`, `cook`, `use`. Extend it to route all other object actions to the appropriate handlers.

## Implementation checklist

- [X] Write a failing test for object interaction routing in `apps/server/src/systems/__tests__/object-interaction.test.ts`.
- [X] Refactor `handleObjectSkillingIntent` into a generic object interaction router.
- [X] Add routing for `pray` → favour system (or stub if E25-S02 not ready).
- [X] Add routing for `read` → dialogue system or content read handler.
- [X] Add routing for `inspect` → examine handler with object description.
- [X] Add routing for `fire` → trapping system (or stub if E25-S04 not ready).
- [X] Add routing for `weave` → trapping system (or stub if E25-S04 not ready).
- [X] Write a passing test for `pray` routing.
- [X] Write a passing test for `read` routing.
- [X] Write a passing test for `inspect` routing.
- [X] Write a passing test for `fire` routing.

## Acceptance criteria

- [X] Object interaction router handles all non-skilling actions.
- [X] Each action is routed to the appropriate system.
- [X] Unknown actions emit a clear error message.
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

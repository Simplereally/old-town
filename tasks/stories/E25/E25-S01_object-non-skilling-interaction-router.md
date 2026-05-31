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

- [ ] Write a failing test for object interaction routing in `apps/server/src/systems/__tests__/object-interaction.test.ts`.
- [ ] Refactor `handleObjectSkillingIntent` into a generic object interaction router.
- [ ] Add routing for `pray` → favour system (or stub if E25-S02 not ready).
- [ ] Add routing for `read` → dialogue system or content read handler.
- [ ] Add routing for `inspect` → examine handler with object description.
- [ ] Add routing for `fire` → trapping system (or stub if E25-S04 not ready).
- [ ] Add routing for `weave` → trapping system (or stub if E25-S04 not ready).
- [ ] Write a passing test for `pray` routing.
- [ ] Write a passing test for `read` routing.
- [ ] Write a passing test for `inspect` routing.
- [ ] Write a passing test for `fire` routing.

## Acceptance criteria

- [ ] Object interaction router handles all non-skilling actions.
- [ ] Each action is routed to the appropriate system.
- [ ] Unknown actions emit a clear error message.
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
- [ ] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

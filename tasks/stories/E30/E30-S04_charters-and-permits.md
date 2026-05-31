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

- [ ] Write a failing test for charters in `apps/server/src/systems/__tests__/charters.test.ts`.
- [ ] Create `charter-system.ts` in `apps/server/src/systems/`.
- [ ] Define charter schema: `id`, `name`, `type` (`area`, `activity`, `content`), `requiredStanding`, `cost`, `duration`.
- [ ] Implement charter issuance: validate standing, deduct cost, grant permit.
- [ ] Implement charter validation: check permit before gated action.
- [ ] Implement charter expiry: remove permit after duration.
- [ ] Write a passing test for charter issuance.
- [ ] Write a passing test for charter validation.
- [ ] Write a passing test for charter expiry.
- [ ] Write a passing test for charter cost deduction.

## Acceptance criteria

- [ ] Charters are issued with validation.
- [ ] Charter validation gates access correctly.
- [ ] Charter expiry removes permits.
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
- [ ] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

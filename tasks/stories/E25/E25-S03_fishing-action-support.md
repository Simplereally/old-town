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

- [ ] Write a failing test for fishing in `apps/server/src/systems/__tests__/fishing.test.ts`.
- [ ] Add `fish` to `GATHER_ACTION_IDS` in skilling system.
- [ ] Implement fishing tool validation: player must have fishing rod equipped or in inventory.
- [ ] Implement fish-specific success chance based on fishing level and fish difficulty.
- [ ] Implement fishing spot depletion: chance to deplete after successful catch, respawn after N ticks.
- [ ] Award fishing XP on successful catch.
- [ ] Write a passing test for fishing tool validation.
- [ ] Write a passing test for fishing success chance.
- [ ] Write a passing test for fishing spot depletion.
- [ ] Write a passing test for fishing XP award.

## Acceptance criteria

- [ ] `fish` action is handled by the gathering system.
- [ ] Fishing tool validation works.
- [ ] Fish-specific success chance is calculated.
- [ ] Fishing spots deplete and respawn.
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

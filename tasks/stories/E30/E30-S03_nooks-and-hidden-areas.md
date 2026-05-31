# E30-S03 — Nooks and Hidden Areas

## Epic

E30 — World Expansion Systems

## Dependency chain

- Depends on: E30-S02
- Blocks: E30-S04

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 18)
- docs/world/nooks.md

## Objective

Implement the Nooks system. Hidden areas that require specific conditions to enter (item, quest, level, time).

## Implementation checklist

- [ ] Write a failing test for nooks in `apps/server/src/systems/__tests__/nooks.test.ts`.
- [ ] Create `nook-system.ts` in `apps/server/src/systems/`.
- [ ] Define nook schema: `id`, `name`, `entryTile`, `hidden`, `requiredItem`, `requiredQuest`, `requiredLevel`, `timeWindow`.
- [ ] Implement nook entry validation: check all conditions.
- [ ] Implement nook reveal: show hidden nook to player if conditions met.
- [ ] Implement nook interior: separate region or tile override.
- [ ] Write a passing test for nook entry validation.
- [ ] Write a passing test for nook reveal.
- [ ] Write a passing test for nook interior.
- [ ] Write a passing test for nook condition failure.

## Acceptance criteria

- [ ] Nook entry validates all conditions.
- [ ] Hidden nooks are revealed when conditions met.
- [ ] Nook interiors are loaded correctly.
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

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

- [X] Write a failing test for nooks in `apps/server/src/systems/__tests__/nooks.test.ts`.
- [X] Create `nook-system.ts` in `apps/server/src/systems/`.
- [X] Define nook schema: `id`, `name`, `entryTile`, `hidden`, `requiredItem`, `requiredQuest`, `requiredLevel`, `timeWindow`.
- [X] Implement nook entry validation: check all conditions.
- [X] Implement nook reveal: show hidden nook to player if conditions met.
- [X] Implement nook interior: separate region or tile override.
- [X] Write a passing test for nook entry validation.
- [X] Write a passing test for nook reveal.
- [X] Write a passing test for nook interior.
- [X] Write a passing test for nook condition failure.

## Acceptance criteria

- [X] Nook entry validates all conditions.
- [X] Hidden nooks are revealed when conditions met.
- [X] Nook interiors are loaded correctly.
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
- [X] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

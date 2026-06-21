# E30-S05 — Public Works System

## Epic

E30 — World Expansion Systems

## Dependency chain

- Depends on: E30-S04
- Blocks: E30-S06

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 20)
- docs/world/public-works.md

## Objective

Implement the Public works system. Collective building projects that require community contributions to complete.

## Implementation checklist

- [X] Write a failing test for public works in `apps/server/src/systems/__tests__/public-works.test.ts`.
- [X] Create `public-works-system.ts` in `apps/server/src/systems/`.
- [X] Define public work schema: `id`, `name`, `requiredResources`, `currentResources`, `contributors`, `completed`.
- [X] Implement contribution: player donates resources, progress increments.
- [X] Implement completion: when all resources met, mark completed, apply world change.
- [X] Implement contributor tracking: record who contributed what.
- [X] Implement reward: distribute rewards to contributors on completion.
- [X] Write a passing test for contribution.
- [X] Write a passing test for completion.
- [X] Write a passing test for contributor tracking.
- [X] Write a passing test for reward distribution.

## Acceptance criteria

- [X] Contributions increment progress.
- [X] Completion triggers world change.
- [X] Contributors are tracked and rewarded.
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

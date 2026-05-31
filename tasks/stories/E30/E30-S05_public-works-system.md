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

- [ ] Write a failing test for public works in `apps/server/src/systems/__tests__/public-works.test.ts`.
- [ ] Create `public-works-system.ts` in `apps/server/src/systems/`.
- [ ] Define public work schema: `id`, `name`, `requiredResources`, `currentResources`, `contributors`, `completed`.
- [ ] Implement contribution: player donates resources, progress increments.
- [ ] Implement completion: when all resources met, mark completed, apply world change.
- [ ] Implement contributor tracking: record who contributed what.
- [ ] Implement reward: distribute rewards to contributors on completion.
- [ ] Write a passing test for contribution.
- [ ] Write a passing test for completion.
- [ ] Write a passing test for contributor tracking.
- [ ] Write a passing test for reward distribution.

## Acceptance criteria

- [ ] Contributions increment progress.
- [ ] Completion triggers world change.
- [ ] Contributors are tracked and rewarded.
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

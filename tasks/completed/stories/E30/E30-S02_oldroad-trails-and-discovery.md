# E30-S02 — Oldroad Trails and Discovery

## Epic

E30 — World Expansion Systems

## Dependency chain

- Depends on: E30-S01
- Blocks: E30-S03

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 17)
- docs/world/oldroad-trails.md

## Objective

Implement the Oldroad Trails system. Hidden trails can be discovered by walking near them, granting buffs and shortcuts.

## Implementation checklist

- [X] Write a failing test for trails in `apps/server/src/systems/__tests__/trails.test.ts`.
- [X] Create `trail-system.ts` in `apps/server/src/systems/`.
- [X] Define trail schema: `id`, `name`, `startTile`, `endTile`, `hidden`, `discoveryRadius`, `buff`.
- [X] Implement trail discovery: check if player is within `discoveryRadius` of hidden trail.
- [X] Implement trail buff: apply buff to player when on trail.
- [X] Implement trail shortcut: faster travel between endpoints.
- [X] Write a passing test for trail discovery.
- [X] Write a passing test for trail buff application.
- [X] Write a passing test for trail shortcut.
- [X] Write a passing test for trail persistence.

## Acceptance criteria

- [X] Trails can be discovered.
- [X] Trail buffs are applied.
- [X] Trail shortcuts work.
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
- [ ] Update the parent epic checklist if this story completes an ordered item.

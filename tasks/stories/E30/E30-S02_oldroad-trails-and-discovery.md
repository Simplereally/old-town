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

- [ ] Write a failing test for trails in `apps/server/src/systems/__tests__/trails.test.ts`.
- [ ] Create `trail-system.ts` in `apps/server/src/systems/`.
- [ ] Define trail schema: `id`, `name`, `startTile`, `endTile`, `hidden`, `discoveryRadius`, `buff`.
- [ ] Implement trail discovery: check if player is within `discoveryRadius` of hidden trail.
- [ ] Implement trail buff: apply buff to player when on trail.
- [ ] Implement trail shortcut: faster travel between endpoints.
- [ ] Write a passing test for trail discovery.
- [ ] Write a passing test for trail buff application.
- [ ] Write a passing test for trail shortcut.
- [ ] Write a passing test for trail persistence.

## Acceptance criteria

- [ ] Trails can be discovered.
- [ ] Trail buffs are applied.
- [ ] Trail shortcuts work.
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

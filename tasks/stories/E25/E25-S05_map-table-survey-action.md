# E25-S05 — Map Table Survey Action

## Epic

E25 — Object Interaction and Content Routing

## Dependency chain

- Depends on: E25-S04
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 15)
- docs/content/action-wiring-audit.md (action IDs: `survey`)
- docs/world/cartography-system.md

## Objective

Implement the map table survey action. When a player uses a map table, reveal a portion of the map and grant Cartography XP.

## Implementation checklist

- [ ] Write a failing test for survey in `apps/server/src/systems/__tests__/survey.test.ts`.
- [ ] Create `cartography-system.ts` in `apps/server/src/systems/`.
- [ ] Implement `survey` action: validate map table object, check for survey tool (quill, parchment).
- [ ] Reveal map tiles in a radius around the map table.
- [ ] Award Cartography XP based on number of new tiles revealed.
- [ ] Update player map state and send to client.
- [ ] Write a passing test for survey action.
- [ ] Write a passing test for map tile reveal.
- [ ] Write a passing test for Cartography XP.
- [ ] Write a passing test for map state persistence.

## Acceptance criteria

- [ ] Survey action reveals map tiles.
- [ ] Cartography XP is awarded.
- [ ] Map state is updated and sent to client.
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

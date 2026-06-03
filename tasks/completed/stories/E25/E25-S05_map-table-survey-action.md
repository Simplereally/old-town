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

- [X] Write a failing test for survey in `apps/server/src/systems/__tests__/survey.test.ts`.
- [X] Create `cartography-system.ts` in `apps/server/src/systems/`.
- [X] Implement `survey` action: validate map table object, check for survey tool (quill, parchment).
- [X] Reveal map tiles in a radius around the map table.
- [X] Award Cartography XP based on number of new tiles revealed.
- [X] Update player map state and send to client.
- [X] Write a passing test for survey action.
- [X] Write a passing test for map tile reveal.
- [X] Write a passing test for Cartography XP.
- [X] Write a passing test for map state persistence.

## Acceptance criteria

- [X] Survey action reveals map tiles.
- [X] Cartography XP is awarded.
- [X] Map state is updated and sent to client.
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
- [X] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

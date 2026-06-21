# E40-S02 — Charter and Permit System

## Epic

E40 — Oldroad Trails and Exploration

## Dependency chain

- Depends on: E40-S01
- Blocks: (epic end)

## Spec references

- P2 gap 12: Oldroad Trails
- P2 gap 14: Charters / permits
- P2 gap 15: Public works

## Objective

Implement charter schema (charter_type, requirements, duration, cost), permit gating (area access requires permit), and charter purchase UI.

## Implementation checklist
- [X] Create/modify: content/charters/starter-charters.json
- [X] Create/modify: apps/server/src/systems/charter-system.ts
- [X] Create/modify: packages/shared/src/content-schemas/charter.ts
- [X] Write test: Charter purchase test
- [X] Write test: Permit gating test
- [X] Write test: Charter expiration test

## Acceptance criteria
- [X] Charter purchase test passes
- [X] Permit gating test passes
- [X] Charter expiration test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E40/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

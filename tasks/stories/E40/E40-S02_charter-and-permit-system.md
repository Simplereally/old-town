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
- [ ] Create/modify: content/charters/starter-charters.json
- [ ] Create/modify: apps/server/src/systems/charter-system.ts
- [ ] Create/modify: packages/shared/src/content-schemas/charter.ts
- [ ] Write test: Charter purchase test
- [ ] Write test: Permit gating test
- [ ] Write test: Charter expiration test

## Acceptance criteria
- [ ] Charter purchase test passes
- [ ] Permit gating test passes
- [ ] Charter expiration test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E40/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

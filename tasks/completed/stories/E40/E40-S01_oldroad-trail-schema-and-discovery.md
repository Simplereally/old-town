# E40-S01 — Oldroad Trail Schema and Discovery

## Epic

E40 — Oldroad Trails and Exploration

## Dependency chain

- Depends on: (epic start)
- Blocks: E40-S02

## Spec references

- P2 gap 12: Oldroad Trails
- P2 gap 14: Charters / permits
- P2 gap 15: Public works

## Objective

Create trail schema (trail_id, steps, rewards, difficulty), implement trail discovery mechanic (clue items trigger trail start), and wire trail step completion.

## Implementation checklist
- [ ] Create/modify: content/trails/starter-trails.json
- [ ] Create/modify: apps/server/src/systems/trail-system.ts
- [ ] Create/modify: packages/shared/src/content-schemas/trail.ts
- [ ] Write test: Trail discovery test
- [ ] Write test: Step completion test
- [ ] Write test: Reward test

## Acceptance criteria
- [ ] Trail discovery test passes
- [ ] Step completion test passes
- [ ] Reward test passes

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

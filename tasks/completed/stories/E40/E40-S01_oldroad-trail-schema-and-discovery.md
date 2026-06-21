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
- [X] Create/modify: content/trails/starter-trails.json
- [X] Create/modify: apps/server/src/systems/trail-system.ts
- [X] Create/modify: packages/shared/src/content-schemas/trail.ts
- [X] Write test: Trail discovery test
- [X] Write test: Step completion test
- [X] Write test: Reward test

## Acceptance criteria
- [X] Trail discovery test passes
- [X] Step completion test passes
- [X] Reward test passes

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

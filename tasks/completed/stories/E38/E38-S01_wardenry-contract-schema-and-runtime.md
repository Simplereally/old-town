# E38-S01 — Wardenry Contract Schema and Runtime

## Epic

E38 — Wardenry Contracts and Identity Systems

## Dependency chain

- Depends on: (epic start)
- Blocks: E38-S02

## Spec references

- P1 gap 9: Wardenry contract runtime
- P2 gap 15: Full Favour boons / oaths / rites
- P2 gap 16: Advanced status effects

## Objective

Create contract schema (target_creature_id, target_count, reward_items, giver NPC), implement contract acceptance, objective tracking, completion detection, reward distribution, and wire `read` on warden board.

## Implementation checklist
- [X] Create/modify: content/contracts/starter-contracts.json
- [X] Create/modify: apps/server/src/systems/contract-system.ts
- [X] Create/modify: apps/server/src/systems/combat-system.ts
- [X] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [X] Create/modify: packages/shared/src/content-schemas/contract.ts
- [X] Write test: Contract acceptance test
- [X] Write test: Kill objective tracking test
- [X] Write test: Contract completion test
- [X] Write test: Reward distribution test

## Acceptance criteria
- [X] Contract acceptance test passes
- [X] Kill objective tracking test passes
- [X] Contract completion test passes
- [X] Reward distribution test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E38/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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
- [ ] Create/modify: content/contracts/starter-contracts.json
- [ ] Create/modify: apps/server/src/systems/contract-system.ts
- [ ] Create/modify: apps/server/src/systems/combat-system.ts
- [ ] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [ ] Create/modify: packages/shared/src/content-schemas/contract.ts
- [ ] Write test: Contract acceptance test
- [ ] Write test: Kill objective tracking test
- [ ] Write test: Contract completion test
- [ ] Write test: Reward distribution test

## Acceptance criteria
- [ ] Contract acceptance test passes
- [ ] Kill objective tracking test passes
- [ ] Contract completion test passes
- [ ] Reward distribution test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E38/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

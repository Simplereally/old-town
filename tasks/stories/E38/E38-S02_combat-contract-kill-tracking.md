# E38-S02 — Combat Contract Kill Tracking

## Epic

E38 — Wardenry Contracts and Identity Systems

## Dependency chain

- Depends on: E38-S01
- Blocks: E38-S03

## Spec references

- P1 gap 9: Wardenry contract runtime
- P2 gap 15: Full Favour boons / oaths / rites
- P2 gap 16: Advanced status effects

## Objective

Wire combat-system to notify contract-system when a player kills a creature. TrackContractObjective, increment counts, mark completion.

## Implementation checklist
- [ ] Create/modify: apps/server/src/systems/combat-system.ts
- [ ] Create/modify: apps/server/src/systems/contract-system.ts
- [ ] Write test: Kill tracking test
- [ ] Write test: Contract progress delta test
- [ ] Write test: Contract completion test

## Acceptance criteria
- [ ] Kill tracking test passes
- [ ] Contract progress delta test passes
- [ ] Contract completion test passes

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

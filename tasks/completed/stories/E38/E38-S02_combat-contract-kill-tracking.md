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
- [X] Create/modify: apps/server/src/systems/combat-system.ts
- [X] Create/modify: apps/server/src/systems/contract-system.ts
- [X] Write test: Kill tracking test
- [X] Write test: Contract progress delta test
- [X] Write test: Contract completion test

## Acceptance criteria
- [X] Kill tracking test passes
- [X] Contract progress delta test passes
- [X] Contract completion test passes

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

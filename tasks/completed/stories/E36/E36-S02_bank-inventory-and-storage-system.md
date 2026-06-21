# E36-S02 — Bank Inventory and Storage System

## Epic

E36 — Economy Runtime: Bank, Shop, and Death

## Dependency chain

- Depends on: E36-S01
- Blocks: E36-S03

## Spec references

- P0 gap 5: Bank / storage runtime
- P0 gap 6: Death + respawn for players
- P0 gap 7: Shop / trade runtime

## Objective

Implement bank inventory component, bank UI packet, deposit/withdraw logic, and wire the `bank` action in intent-dispatcher. Bank should be a separate inventory that persists with the player.

## Implementation checklist
- [X] Create/modify: apps/server/src/ecs/components.ts
- [X] Create/modify: apps/server/src/systems/bank-system.ts
- [X] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [X] Create/modify: apps/server/src/items/inventory.ts
- [X] Write test: Bank deposit test
- [X] Write test: Bank withdraw test
- [X] Write test: Bank full-state sync test

## Acceptance criteria
- [X] Bank deposit test passes
- [X] Bank withdraw test passes
- [X] Bank full-state sync test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E36/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

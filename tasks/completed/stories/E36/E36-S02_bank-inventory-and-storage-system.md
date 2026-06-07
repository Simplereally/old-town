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
- [ ] Create/modify: apps/server/src/ecs/components.ts
- [ ] Create/modify: apps/server/src/systems/bank-system.ts
- [ ] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [ ] Create/modify: apps/server/src/items/inventory.ts
- [ ] Write test: Bank deposit test
- [ ] Write test: Bank withdraw test
- [ ] Write test: Bank full-state sync test

## Acceptance criteria
- [ ] Bank deposit test passes
- [ ] Bank withdraw test passes
- [ ] Bank full-state sync test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E36/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

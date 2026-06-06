# E36-S03 — Shop Stock Schema and Transaction Runtime

## Epic

E36 — Economy Runtime: Bank, Shop, and Death

## Dependency chain

- Depends on: E36-S02
- Blocks: (epic end)

## Spec references

- P0 gap 5: Bank / storage runtime
- P0 gap 6: Death + respawn for players
- P0 gap 7: Shop / trade runtime

## Objective

Create shop stock schema (item_id, base_price, initial_stock, max_stock, restock_ticks), implement transaction logic (buy/sell with price scaling), wire `trade` action, and emit shop UI packets.

## Implementation checklist
- [ ] Create/modify: content/shops/starter-shops.json
- [ ] Create/modify: apps/server/src/systems/shop-system.ts
- [ ] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [ ] Create/modify: packages/shared/src/content-schemas/shop.ts
- [ ] Write test: Shop buy test
- [ ] Write test: Shop sell test
- [ ] Write test: Shop restock test
- [ ] Write test: Price scaling test

## Acceptance criteria
- [ ] Shop buy test passes
- [ ] Shop sell test passes
- [ ] Shop restock test passes
- [ ] Price scaling test passes

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

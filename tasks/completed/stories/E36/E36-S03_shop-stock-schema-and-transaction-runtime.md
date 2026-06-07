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
- [X] Create/modify: content/shops/starter-shops.json
- [X] Create/modify: apps/server/src/systems/shop-system.ts
- [X] Create/modify: apps/server/src/sim/intent-dispatcher.ts
- [X] Create/modify: packages/shared/src/content-schemas/shop.ts
- [X] Write test: Shop buy test
- [X] Write test: Shop sell test
- [X] Write test: Shop restock test
- [X] Write test: Price scaling test

## Acceptance criteria
- [X] Shop buy test passes
- [X] Shop sell test passes
- [X] Shop restock test passes
- [X] Price scaling test passes

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

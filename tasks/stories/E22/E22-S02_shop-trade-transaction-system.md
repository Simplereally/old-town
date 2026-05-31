# E22-S02 — Shop Trade Transaction System

## Epic

E22 — Economy Runtime

## Dependency chain

- Depends on: E22-S01, E16-S01
- Blocks: E22-S03

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 7)
- docs/content/action-wiring-audit.md (action IDs: `trade`, `buy`, `sell`)
- docs/economy/shop-system.md

## Objective

Implement the shop trade transaction system: buy and sell logic with stock management, price calculation, and currency handling. This closes the gap where the `trade` action emits "not yet implemented."

## Implementation checklist

- [ ] Write a failing test for shop system in `apps/server/src/systems/__tests__/shop.test.ts`.
- [ ] Create `shop-system.ts` in `apps/server/src/systems/`.
- [ ] Load shop definitions from content registry.
- [ ] Implement buy logic: check stock, check currency, deduct currency, add item, update stock.
- [ ] Implement sell logic: check item in inventory, check shop buys it, calculate price, add currency, remove item, update stock.
- [ ] Implement stock restock: increment stock per `restockRate` ticks up to `maxQuantity`.
- [ ] Write a passing test for buy transaction.
- [ ] Write a passing test for sell transaction.
- [ ] Write a passing test for stock restock.
- [ ] Write a passing test for price calculation with multipliers.

## Acceptance criteria

- [ ] Shop stock is loaded from content and managed at runtime.
- [ ] Buy and sell transactions validate all constraints.
- [ ] Stock restocks automatically on tick.
- [ ] Price calculation uses shop multipliers.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E22/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

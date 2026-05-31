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

- [X] Write a failing test for shop system in `apps/server/src/systems/__tests__/shop.test.ts`.
- [X] Create `shop-system.ts` in `apps/server/src/systems/`.
- [X] Load shop definitions from content registry.
- [X] Implement buy logic: check stock, check currency, deduct currency, add item, update stock.
- [X] Implement sell logic: check item in inventory, check shop buys it, calculate price, add currency, remove item, update stock.
- [X] Implement stock restock: increment stock per `restockRate` ticks up to `maxQuantity`.
- [X] Write a passing test for buy transaction.
- [X] Write a passing test for sell transaction.
- [X] Write a passing test for stock restock.
- [X] Write a passing test for price calculation with multipliers.

## Acceptance criteria

- [X] Shop stock is loaded from content and managed at runtime.
- [X] Buy and sell transactions validate all constraints.
- [X] Stock restocks automatically on tick.
- [X] Price calculation uses shop multipliers.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E22/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E16-S01 — Define Shop Schema

## Epic

E16 — Economy Schema Gaps

## Dependency chain

- Depends on: E15-S05
- Blocks: E16-S02, E16-S04

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §20
- docs/economy/shop-system.md

## Objective

Create the `shopDefSchema` and `shopStockSchema` in `packages/shared/src/content-schemas/shop.ts`, register them in the content schema index, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for `shopDefSchema` validation in `packages/shared/src/content-schemas/__tests__/shop.test.ts`.
- [X] Define `shopDefSchema` with fields: `id`, `name`, `stock` (array of `shopStockSchema`), `currency` (default `"coins"`), `sellMultiplier` (number, default `0.6`), `buyMultiplier` (number, default `1.0`), `restockTicks` (integer, default `100`).
- [X] Define `shopStockSchema` with fields: `itemId` (reference), `quantity` (integer, default `1`), `maxQuantity` (integer, default `1`), `price` (integer, optional), `restockRate` (integer, default `1`).
- [X] Add `"shop"` to `CONTENT_DIR_KINDS` and `ContentRegistries` in `packages/shared/src/content-schemas/index.ts`.
- [X] Export the schemas from `packages/shared/src/content-schemas/index.ts`.
- [X] Write a passing test for `shopDefSchema` roundtrip validation.
- [X] Write a passing test for `shopStockSchema` validation.
- [X] Write a passing test for `shopDefSchema` default values.
- [X] Write a passing test for `shopStockSchema` cross-reference validation (itemId must exist).

## Acceptance criteria

- [X] `shopDefSchema` and `shopStockSchema` exist and are exported.
- [X] `shopDefSchema` validates with Zod and includes all required fields.
- [X] `shopStockSchema` validates with Zod and includes all required fields.
- [X] Default values are correctly applied when fields are omitted.
- [X] Cross-reference validation fails for invalid `itemId` references.
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
- [X] Move this story file to `tasks/completed/stories/E16/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

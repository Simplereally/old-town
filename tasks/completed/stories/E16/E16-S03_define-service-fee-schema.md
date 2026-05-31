# E16-S03 — Define Service Fee Schema

## Epic

E16 — Economy Schema Gaps

## Dependency chain

- Depends on: E16-S02
- Blocks: E16-S04

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §20
- docs/economy/services-and-fees.md

## Objective

Create the `serviceFeeSchema` in `packages/shared/src/content-schemas/service-fee.ts`, register it in the content schema index, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for `serviceFeeSchema` validation in `packages/shared/src/content-schemas/__tests__/service-fee.test.ts`.
- [X] Define `serviceFeeSchema` with fields: `id`, `name`, `serviceType` (enum: `repair`, `teleport`, `identify`, `enchant`, `craft`), `baseFee` (integer, default `0`), `levelMultiplier` (number, default `1.0`), `materialCost` (array of `{ itemId, quantity }`, optional), `currency` (default `"coins"`), `requiresQuest` (questId, optional).
- [X] Add `"serviceFee"` to `CONTENT_DIR_KINDS` and `ContentRegistries` in `packages/shared/src/content-schemas/index.ts`.
- [X] Export the schema from `packages/shared/src/content-schemas/index.ts`.
- [X] Write a passing test for `serviceFeeSchema` roundtrip validation.
- [X] Write a passing test for `serviceFeeSchema` default values.
- [X] Write a passing test for `serviceFeeSchema` enum validation.

## Acceptance criteria

- [X] `serviceFeeSchema` exists and is exported.
- [X] `serviceFeeSchema` validates with Zod and includes all required fields.
- [X] Default values are correctly applied when fields are omitted.
- [X] `serviceType` enum validates correctly.
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

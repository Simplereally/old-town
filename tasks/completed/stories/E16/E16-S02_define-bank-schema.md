# E16-S02 — Define Bank Schema

## Epic

E16 — Economy Schema Gaps

## Dependency chain

- Depends on: E16-S01
- Blocks: E16-S03, E16-S04

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- docs/economy/banks-storage-and-reclaim.md

## Objective

Create the `bankDefSchema` in `packages/shared/src/content-schemas/bank.ts`, register it in the content schema index, align it with the persistence schema in `character-snapshot.ts`, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for `bankDefSchema` validation in `packages/shared/src/content-schemas/__tests__/bank.test.ts`.
- [X] Define `bankDefSchema` with fields: `id`, `name`, `location` (object with `plane`, `tileX`, `tileY`), `capacity` (integer, default `400`), `tabs` (boolean, default `true`), `feePerItem` (integer, default `0`).
- [X] Add `"bank"` to `CONTENT_DIR_KINDS` and `ContentRegistries` in `packages/shared/src/content-schemas/index.ts`.
- [X] Export the schema from `packages/shared/src/content-schemas/index.ts`.
- [X] Align `bankDefSchema` fields with `character-snapshot.ts` bank storage representation.
- [X] Write a passing test for `bankDefSchema` roundtrip validation.
- [X] Write a passing test for `bankDefSchema` default values.
- [X] Write a passing test for `bankDefSchema` location validation.

## Acceptance criteria

- [X] `bankDefSchema` exists and is exported.
- [X] `bankDefSchema` validates with Zod and includes all required fields.
- [X] Default values are correctly applied when fields are omitted.
- [X] Schema aligns with persistence layer bank representation.
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

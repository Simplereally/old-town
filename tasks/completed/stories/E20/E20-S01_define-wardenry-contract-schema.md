# E20-S01 — Define Wardenry Contract Schema

## Epic

E20 — Identity and Contract Schema Gaps

## Dependency chain

- Depends on: E19-S03, E16-S04
- Blocks: E20-S02

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §10
- docs/creatures/wardenry-contracts.md
- docs/creatures/wardenry-favour.md

## Objective

Create the `contractDefSchema` in `packages/shared/src/content-schemas/contract.ts`, register it in the content schema index, align it with the quest schema, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for `contractDefSchema` in `packages/shared/src/content-schemas/__tests__/contract.test.ts`.
- [X] Define `contractDefSchema` with fields: `id`, `name`, `description`, `contractType` (enum: `bounty`, `extermination`, `collection`, `escort`), `targetCreatureIds` (array of npcId references), `targetCount` (integer, default `1`), `rewardItems` (array of `{ itemId, quantity }`, optional), `rewardXp` (array of `{ skillId, amount }`, optional), `rewardReputation` (object with `factionId`, `amount`, optional), `requiredLevel` (integer, default `1`), `requiredQuest` (questId, optional), `timeLimitTicks` (integer, optional), `maxConcurrent` (integer, default `1`), `completionTrigger` (enum: `kill`, `collect`, `deliver`).
- [X] Add `"contract"` to `CONTENT_DIR_KINDS` and `ContentRegistries` in `packages/shared/src/content-schemas/index.ts`.
- [X] Export the schema from `packages/shared/src/content-schemas/index.ts`.
- [X] Add cross-reference validation in `content-references.ts` for `targetCreatureIds`, `rewardItems`, `rewardXp`, `requiredQuest` references.
- [X] Write a passing test for `contractDefSchema` roundtrip validation.
- [X] Write a passing test for `contractDefSchema` default values.
- [X] Write a passing test for `contractDefSchema` enum validation.
- [X] Write a passing test for cross-reference validation.

## Acceptance criteria

- [X] `contractDefSchema` exists and is exported.
- [X] `contractDefSchema` validates with Zod and includes all required fields.
- [X] Default values are correctly applied when fields are omitted.
- [X] Contract type enum validates correctly.
- [X] Cross-reference validation catches invalid references.
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
- [X] Move this story file to `tasks/completed/stories/E20/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

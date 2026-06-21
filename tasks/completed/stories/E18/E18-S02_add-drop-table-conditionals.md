# E18-S02 — Add Drop Table Conditionals

## Epic

E18 — Combat and Status Schema Gaps

## Dependency chain

- Depends on: E18-S01
- Blocks: E18-S03, E18-S04

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §9
- docs/creatures/wardenry-contracts.md

## Objective

Extend the `dropEntrySchema` in `packages/shared/src/content-schemas/drop.ts` to support conditional requirements (quest, skill, item), update cross-validation, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for conditional drops in `packages/shared/src/content-schemas/__tests__/drop.test.ts`.
- [X] Define `conditionalDropSchema` with fields: `questId` (questId reference, optional), `skillId` (skillId reference, optional), `skillLevel` (integer, optional), `itemId` (itemId reference, optional), `requiredStatus` (statusEffectId reference, optional).
- [X] Add `requirements` array (of `conditionalDropSchema`) to `dropEntrySchema`.
- [X] Update `content-references.ts` to validate conditional drop references.
- [X] Ensure existing drop content still validates (backward compatibility).
- [X] Write a passing test for `conditionalDropSchema` validation.
- [X] Write a passing test for conditional drop cross-reference validation.
- [X] Write a passing test for backward compatibility.

## Acceptance criteria

- [X] `conditionalDropSchema` exists and is exported.
- [X] `dropEntrySchema` includes `requirements` array.
- [X] Default values are correctly applied when fields are omitted.
- [X] Existing drop content still validates without errors.
- [X] Cross-reference validation catches invalid references.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run content:validate`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E18/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

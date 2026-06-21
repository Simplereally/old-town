# E19-S01 — Expand Consumable Effects Beyond Heal

## Epic

E19 — Consumable and Recipe Schema Gaps

## Dependency chain

- Depends on: E18-S04
- Blocks: E19-S02, E19-S03

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- docs/consumables/consumable-system.md

## Objective

Extend the `consumableDefSchema` in `packages/shared/src/content-schemas/consumable.ts` to support potions, salves, brews, and status effect operations, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for expanded consumable effects in `packages/shared/src/content-schemas/__tests__/consumable.test.ts`.
- [X] Add `effectType` enum to `consumableDefSchema`: `heal`, `restore`, `boost`, `cure`, `apply_status`, `remove_status`.
- [X] Add `effectValue` (integer, optional) to `consumableDefSchema`.
- [X] Add `durationTicks` (integer, optional) to `consumableDefSchema`.
- [X] Add `statusEffectId` (statusEffectId reference, optional) to `consumableDefSchema`.
- [X] Add `curesStatus` (statusEffectId reference, optional) to `consumableDefSchema`.
- [X] Add `boostsSkill` (object with `skillId`, `boostAmount`, optional) to `consumableDefSchema`.
- [X] Ensure existing consumable content still validates (backward compatibility).
- [X] Write a passing test for expanded consumable effect validation.
- [X] Write a passing test for default values.
- [X] Write a passing test for backward compatibility.

## Acceptance criteria

- [X] `consumableDefSchema` includes expanded effect fields.
- [X] `effectType` enum validates correctly.
- [X] Default values are correctly applied when fields are omitted.
- [X] Existing consumable content still validates without errors.
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
- [X] Move this story file to `tasks/completed/stories/E19/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

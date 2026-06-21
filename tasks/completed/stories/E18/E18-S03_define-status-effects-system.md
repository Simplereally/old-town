# E18-S03 — Define Status Effects System

## Epic

E18 — Combat and Status Schema Gaps

## Dependency chain

- Depends on: E18-S02
- Blocks: E18-S04, E19-S01

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §9
- docs/consumables/status-effects.md

## Objective

Create the `statusEffectDefSchema` in `packages/shared/src/content-schemas/status-effect.ts`, register it, extend the `effectSchema` with status effect operations, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for `statusEffectDefSchema` in `packages/shared/src/content-schemas/__tests__/status-effect.test.ts`.
- [X] Define `statusEffectDefSchema` with fields: `id`, `name`, `description`, `icon` (assetId reference, optional), `durationTicks` (integer, default `10`), `maxStacks` (integer, default `1`), `effectType` (enum: `buff`, `debuff`, `dot`, `hot`, `cc`), `statModifiers` (array of `{ stat, value, mode }`, optional), `tickEffect` (effectSchema reference, optional), `onExpire` (effectSchema reference, optional), `cureItems` (array of itemId references, optional).
- [X] Add `apply_status`, `remove_status`, `cure_status` to `effectSchema` enum.
- [X] Add `"statusEffect"` to `CONTENT_DIR_KINDS` and `ContentRegistries` in `packages/shared/src/content-schemas/index.ts`.
- [X] Export the schema from `packages/shared/src/content-schemas/index.ts`.
- [X] Create starter status effect content in `content/status-effects/` (at least 3 definitions: e.g., `poison.json`, `strength_boost.json`, `stun.json`).
- [X] Write a passing test for `statusEffectDefSchema` roundtrip validation.
- [X] Write a passing test for `statusEffectDefSchema` default values.
- [X] Write a passing test for `effectSchema` status effect operations.

## Acceptance criteria

- [X] `statusEffectDefSchema` exists and is exported.
- [X] `statusEffectDefSchema` validates with Zod and includes all required fields.
- [X] `effectSchema` supports `apply_status`, `remove_status`, `cure_status` operations.
- [X] Default values are correctly applied when fields are omitted.
- [X] Starter status effect content exists and validates.
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

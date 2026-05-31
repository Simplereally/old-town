# E18-S01 — Extend Creature Movement and Aggression

## Epic

E18 — Combat and Status Schema Gaps

## Dependency chain

- Depends on: E15-S05
- Blocks: E18-S02, E18-S04, E20-S01

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §9
- docs/creatures/wardenry-contracts.md

## Objective

Extend the `npcDefSchema` in `packages/shared/src/content-schemas/npc.ts` to include creature movement and aggression fields, define the `creatureKind` enum, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for creature fields in `packages/shared/src/content-schemas/__tests__/npc.test.ts`.
- [X] Define `creatureKind` enum: `passive`, `aggressive`, `retaliating`, `fleeing`.
- [X] Add `movementType` enum to `npcDefSchema`: `static`, `wander`, `patrol`, `chase`.
- [X] Add `aggressionMode` enum to `npcDefSchema`: `peaceful`, `aggressive`, `retaliate`.
- [X] Add `weakness` object to `npcDefSchema`: `element` (enum: `fire`, `water`, `earth`, `air`, `none`), `multiplier` (number, default `1.0`).
- [X] Add `trophyId` (itemId reference, optional) to `npcDefSchema`.
- [X] Add `contractEligible` (boolean, default `false`) to `npcDefSchema`.
- [X] Ensure existing NPC content still validates (backward compatibility).
- [X] Write a passing test for creature field validation.
- [X] Write a passing test for default values.
- [X] Write a passing test for backward compatibility.

## Acceptance criteria

- [X] `creatureKind` enum is defined and exported.
- [X] `npcDefSchema` includes movement and aggression fields.
- [X] Default values are correctly applied when fields are omitted.
- [X] Existing NPC content still validates without errors.
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

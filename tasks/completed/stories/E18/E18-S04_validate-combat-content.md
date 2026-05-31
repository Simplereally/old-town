# E18-S04 — Validate Combat Content

## Epic

E18 — Combat and Status Schema Gaps

## Dependency chain

- Depends on: E18-S03
- Blocks: E19-S01

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §9
- docs/creatures/wardenry-contracts.md
- docs/consumables/status-effects.md

## Objective

Update starter combat content (NPCs, drops, status effects) with new fields, run validation, and write integration tests.

## Implementation checklist

- [X] Update starter NPC content in `content/npcs/` to include movement and aggression fields.
- [X] Update starter drop content in `content/drops/` to include conditional requirements where appropriate.
- [X] Create starter status effect content in `content/status-effects/`.
- [X] Add cross-reference validation for `trophyId` in NPC definitions.
- [X] Add cross-reference validation for `cureItems` in status effect definitions.
- [X] Write a passing integration test for combat content validation.
- [X] Run `bun run content:validate` and fix any errors.

## Acceptance criteria

- [X] Starter NPC content includes movement and aggression fields.
- [X] Starter drop content includes conditional requirements where appropriate.
- [X] Starter status effect content exists and validates.
- [X] `bun run content:validate` passes with zero errors.
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

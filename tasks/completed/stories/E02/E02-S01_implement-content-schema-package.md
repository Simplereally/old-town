# E02-S01 — Implement content schema package

## Epic

E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E01-S06
- Blocks: next story in `E02` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Objective

Create runtime validation schemas for all first-wave content definition types.

## Implementation checklist

- [X] Create schemas for ItemDef, EquipmentDef, ConsumableDef, NpcDef, ObjectDef, SkillDef, ResourceNodeDef, SpellDef, DropTableDef, QuestDef, DialogueDef, RegionMapDef.
- [X] Reuse shared ID validators.
- [X] Ensure schemas reject unknown fields unless explicitly allowed.
- [X] Add fixture tests for valid and invalid definitions.
- [X] Export inferred TypeScript types from schemas.

## Acceptance criteria

- [X] Every content JSON file can be validated with one schema entry point.
- [X] Invalid references and malformed fields produce actionable errors.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E02/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

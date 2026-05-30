# E01-S06 — Define content ID and asset reference conventions

## Epic

E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E01-S05
- Blocks: next story in `E01` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Objective

Standardize original-content IDs and asset references before registries are implemented.

## Implementation checklist

- [X] Define ID naming rules for item, NPC, object, skill, spell, quest, drop table, animation, material, and asset IDs.
- [X] Create shared AssetId type.
- [X] Create validation regex for lowercase snake-case IDs.
- [X] Document that OSRS/Jagex IDs/assets/protocol/cache content are not allowed.
- [X] Add tests for valid/invalid IDs.

## Acceptance criteria

- [X] Content IDs are stable strings, not legacy numeric IDs.
- [X] Illegal names and empty IDs fail validation.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E01/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

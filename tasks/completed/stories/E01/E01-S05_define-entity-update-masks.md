# E01-S05 — Define entity update masks

## Epic

E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E01-S04
- Blocks: next story in `E01` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Objective

Implement bitmask flags for entity updates modeled after the spec: position, facing, animation, graphic, hitsplat, overhead text, appearance, equipment, health bar, transform, and move speed.

## Implementation checklist

- [X] Create EntityUpdateMask enum.
- [X] Create mask composition/decomposition helpers.
- [X] Create typed payload map keyed by mask.
- [X] Validate that payloads match masks.
- [X] Add tests for combined masks and missing payload failures.

## Acceptance criteria

- [X] Entity updates can carry multiple changes without full entity replacement.
- [X] Mask helpers are shared by server delta builder and client delta applier.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E01/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

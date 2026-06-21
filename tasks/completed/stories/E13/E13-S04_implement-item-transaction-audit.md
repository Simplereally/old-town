# E13-S04 — Implement item transaction audit

## Epic

E13 — Persistence, Character Save/Load, and Item Audit

## Dependency chain

- Depends on: E13-S03
- Blocks: next story in `E13` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §20
- POC_SPEC.md §21
- POC_SPEC.md §25
- POC_SPEC.md §27

## Objective

Record every authoritative item gain/loss/move reason for dupe investigation.

## Implementation checklist

- [X] Create audit event model with tick, characterId, itemId, quantity, reason, before/after, metadata.
- [X] Emit audit events from InventorySystem add/remove/drop/pickup/quest/reward/consume.
- [X] Persist audit events through adapter.
- [X] Add tests for no unaudited item mutation paths.
- [X] Add dev command or log view for recent audit events.

## Acceptance criteria

- [X] Every item quantity mutation creates an audit event.
- [X] Audit does not give gameplay authority.
- [X] Audit events include enough context to trace drops/quest rewards/food/beads.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

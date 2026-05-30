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

- [ ] Create audit event model with tick, characterId, itemId, quantity, reason, before/after, metadata.
- [ ] Emit audit events from InventorySystem add/remove/drop/pickup/quest/reward/consume.
- [ ] Persist audit events through adapter.
- [ ] Add tests for no unaudited item mutation paths.
- [ ] Add dev command or log view for recent audit events.

## Acceptance criteria

- [ ] Every item quantity mutation creates an audit event.
- [ ] Audit does not give gameplay authority.
- [ ] Audit events include enough context to trace drops/quest rewards/food/runes.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

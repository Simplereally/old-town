# E08-S03 — Implement equipment system

## Epic

E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E08-S02
- Blocks: next story in `E08` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Objective

Equip and unequip items into defined slots and recalculate combat bonuses/appearance hash.

## Implementation checklist

- [X] Create EquipmentComponent with canonical slots.
- [X] Validate item has equipment data and skill requirements.
- [X] Handle occupied slot swap back into inventory.
- [X] Recompute combat bonuses only on equipment changes.
- [X] Emit equipment and appearance update masks.
- [X] Add tests for equip requirements, occupied slots, full inventory unequip failure, bonus sums.

## Acceptance criteria

- [X] Equipment slots match POC_SPEC.md §16.3.
- [X] Combat bonuses are deterministic and content-driven.
- [X] Appearance/equipment deltas update client UI/rendering.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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

- [ ] Create EquipmentComponent with canonical slots.
- [ ] Validate item has equipment data and skill requirements.
- [ ] Handle occupied slot swap back into inventory.
- [ ] Recompute combat bonuses only on equipment changes.
- [ ] Emit equipment and appearance update masks.
- [ ] Add tests for equip requirements, occupied slots, full inventory unequip failure, bonus sums.

## Acceptance criteria

- [ ] Equipment slots match POC_SPEC.md §16.3.
- [ ] Combat bonuses are deterministic and content-driven.
- [ ] Appearance/equipment deltas update client UI/rendering.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

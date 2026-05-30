# E08-S01 — Implement inventory container system

## Epic

E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E07-S05
- Blocks: next story in `E08` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Objective

Create authoritative 28-slot inventory behavior with stackable and unstackable item support.

## Implementation checklist

- [ ] Implement InventoryComponent with 28 slots.
- [ ] Implement add, remove, move, swap, hasAll, count, firstFreeSlot, stack merge.
- [ ] Respect stackable flag from item definitions.
- [ ] Emit InventoryDelta for every mutation.
- [ ] Add tests for full inventory, stack merges, remove failures, and slot swaps.

## Acceptance criteria

- [ ] Client cannot directly mutate inventory.
- [ ] Inventory full prevents item rewards.
- [ ] Deltas are sufficient for UI to update.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

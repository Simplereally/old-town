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

- [X] Implement InventoryComponent with 28 slots.
- [X] Implement add, remove, move, swap, hasAll, count, firstFreeSlot, stack merge.
- [X] Respect stackable flag from item definitions.
- [X] Emit InventoryDelta for every mutation.
- [X] Add tests for full inventory, stack merges, remove failures, and slot swaps.

## Acceptance criteria

- [X] Client cannot directly mutate inventory.
- [X] Inventory full prevents item rewards.
- [X] Deltas are sufficient for UI to update.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E08-S04 — Implement consumables and healing

## Epic

E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E08-S03
- Blocks: next story in `E08` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Objective

Make food and consumables work inside the tick phase order with explicit combat interaction hooks.

## Implementation checklist

- [ ] Implement ConsumableDef handling.
- [ ] Heal HP up to max HP.
- [ ] Consume item on successful eat.
- [ ] Apply configured eat delay/cooldown component.
- [ ] Document and test whether healing occurs before or after pending hit application according to phase order.
- [ ] Emit hitsplat/health/inventory deltas.

## Acceptance criteria

- [ ] Food cannot overheal beyond max HP unless content explicitly allows it.
- [ ] Eating invalid/non-food item fails without mutation.
- [ ] Tick priority is explicit and tested.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

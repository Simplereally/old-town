# E08-S02 — Implement item action handling

## Epic

E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E08-S01
- Blocks: next story in `E08` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Objective

Route item option intents to authoritative item action scripts.

## Implementation checklist

- [ ] Implement ItemIntent handler for equip, eat, drop, examine, and use placeholder.
- [ ] Validate item exists in inventory slot.
- [ ] Consume or move items only through InventorySystem.
- [ ] Emit server messages for invalid actions.
- [ ] Add tests for missing slot, wrong item, eat/equip/drop success/failure.

## Acceptance criteria

- [ ] Invalid item actions cannot change state.
- [ ] Every successful item action emits deltas/messages as required.
- [ ] Examine works without mutation.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

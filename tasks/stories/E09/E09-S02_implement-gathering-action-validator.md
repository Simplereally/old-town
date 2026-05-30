# E09-S02 — Implement gathering action validator

## Epic

E09 — Skilling and Resource Node Loops

## Dependency chain

- Depends on: E09-S01
- Blocks: next story in `E09` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §15
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Validate tool, level, inventory, reach, LoS, and node state before and during repeat gathering actions.

## Implementation checklist

- [ ] Implement common GatherAction validator.
- [ ] Check adjacency or configured reach.
- [ ] Check required skill level.
- [ ] Check required tool tags from inventory/equipment.
- [ ] Check inventory has room for output.
- [ ] Revalidate on every repeated action tick.
- [ ] Add tests for wrong tool, low level, full inventory, movement interrupt, depleted node.

## Acceptance criteria

- [ ] Gathering cannot start or continue when prerequisites fail.
- [ ] Movement cancels weak gathering actions.
- [ ] Failure reason is sent as server message.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

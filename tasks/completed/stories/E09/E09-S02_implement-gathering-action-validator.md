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

- [X] Implement common GatherAction validator.
- [X] Check adjacency or configured reach.
- [X] Check required skill level.
- [X] Check required tool tags from inventory/equipment.
- [X] Check inventory has room for output.
- [X] Revalidate on every repeated action tick.
- [X] Add tests for wrong tool, low level, full inventory, movement interrupt, depleted node.

## Acceptance criteria

- [X] Gathering cannot start or continue when prerequisites fail.
- [X] Movement cancels weak gathering actions.
- [X] Failure reason is sent as server message.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

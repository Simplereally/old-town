# E02-S03 — Seed core skills and XP table

## Epic

E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E02-S02
- Blocks: next story in `E02` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Objective

Create the first skill definitions and exponential XP table required by combat, magic, woodcutting, mining, and cooking.

## Implementation checklist

- [X] Implement XP table generator from level 1 to 99.
- [X] Create skill defs for attack, strength, defence, hitpoints, magic, woodcutting, mining, cooking.
- [X] Add unlock arrays even when initially empty.
- [X] Validate level 2, 3, 92, and 99 XP checkpoints against the spec-derived table.
- [X] Add tests proving level lookup from XP.

## Acceptance criteria

- [X] Skills are content-defined.
- [X] XP-to-level and level-to-XP helpers are shared and tested.

## Validation commands

- [X] `bun run content:validate`
- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E02/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

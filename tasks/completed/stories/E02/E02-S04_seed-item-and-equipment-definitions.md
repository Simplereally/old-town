# E02-S04 — Seed item and equipment definitions

## Epic

E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E02-S03
- Blocks: next story in `E02` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Objective

Create original Old Town starter items required by POC gameplay.

## Implementation checklist

- [X] Create at least 3 weapons, 3 armour pieces, 2 foods, 2 logs, 2 ores, 2 runes, 1 staff, coins, axe, and pickaxe.
- [X] Define 28-slot inventory assumptions in shared constants.
- [X] Add equipment slots and stat bonuses to equipment items.
- [X] Add consumable healing data to food items.
- [X] Add original icon/model asset references even if placeholder assets are used.

## Acceptance criteria

- [X] No item copies OSRS names/assets.
- [X] Every item validates and has examine text.
- [X] Equipment bonuses can be summed by future systems.

## Validation commands

- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E02/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

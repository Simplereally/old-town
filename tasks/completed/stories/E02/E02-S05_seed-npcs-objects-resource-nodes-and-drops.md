# E02-S05 — Seed NPCs, objects, resource nodes, and drops

## Epic

E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E02-S04
- Blocks: next story in `E02` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Objective

Create the original content needed for gathering and combat loops.

## Implementation checklist

- [X] Create NPCs for baker, guard, goblin, rat, miner, and woodsman.
- [X] Create object defs for trees, rocks, range/furnace, doors, chest, and quest oven.
- [X] Create resource node defs for at least two tree tiers and two ore tiers.
- [X] Create drop tables for goblin and rat.
- [X] Define NPC sizes, combat stats, options, respawn ticks, wander radius, and drops.

## Acceptance criteria

- [X] NPCs and objects are fully content-defined.
- [X] Resource nodes include level, action ticks, XP, output item, depletion chance, and respawn ticks.

## Validation commands

- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E02/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

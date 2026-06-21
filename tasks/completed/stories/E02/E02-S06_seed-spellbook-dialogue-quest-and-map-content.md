# E02-S06 — Seed spellbook, dialogue, quest, and map content

## Epic

E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E02-S05
- Blocks: next story in `E02` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Objective

Create the first playable content loop: one spellbook, one dialogue graph, one quest, and one 64x64 region.

## Implementation checklist

- [X] Create Ember Flick or equivalent basic attack spell.
- [X] Create Homeward Murmur or equivalent delayed home teleport spell.
- [X] Create baker dialogue graph.
- [X] Create Smoke Over Old Town quest with stages, objectives, triggers, and rewards.
- [X] Create one 64x64 region map with village, forest, mine, cellar/cave markers, object placements, and NPC spawns.

## Acceptance criteria

- [X] Quest content references only validated items/NPCs/objects/dialogue/skills.
- [X] Map content validates and can be loaded by server/world systems.

## Validation commands

- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E02/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

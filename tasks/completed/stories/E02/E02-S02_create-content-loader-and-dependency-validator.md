# E02-S02 — Create content loader and dependency validator

## Epic

E02 — Content System, Schemas, Registries, and Seed Data

## Dependency chain

- Depends on: E02-S01
- Blocks: next story in `E02` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §17
- POC_SPEC.md §18
- POC_SPEC.md §19
- POC_SPEC.md §23

## Objective

Load all content files from the content directory and validate cross-references.

## Implementation checklist

- [X] Implement recursive JSON loader.
- [X] Build registries for items, NPCs, objects, skills, spells, quests, dialogue, drop tables, maps, materials, animations.
- [X] Validate cross-references such as item IDs in drops, spell rune costs, NPC drop table IDs, quest dialogue IDs.
- [X] Detect duplicate IDs across each registry.
- [X] Expose a CLI command `content:validate`.

## Acceptance criteria

- [X] `bun run content:validate` passes on seed content.
- [X] Missing or duplicate references fail with file path and ID context.

## Validation commands

- [X] `bun run content:validate`
- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E02/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

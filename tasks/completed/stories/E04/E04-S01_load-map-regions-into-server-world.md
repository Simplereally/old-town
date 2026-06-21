# E04-S01 — Load map regions into server world

## Epic

E04 — World Map, Collision, Movement, and Pathfinding

## Dependency chain

- Depends on: E03-S06
- Blocks: next story in `E04` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §6
- POC_SPEC.md §11
- POC_SPEC.md §12

## Objective

Convert validated RegionMapDef content into runtime tile/object/NPC/resource-node entities.

## Implementation checklist

- [X] Implement region loader from content registry.
- [X] Instantiate tiles with height, underlay, overlay, water, bridge, zone, and collision fields.
- [X] Instantiate placed objects, NPC spawns, ground item spawns, triggers, and resource nodes.
- [X] Preserve original content definition IDs and runtime entity IDs separately.
- [X] Add tests for loading the seed 64x64 region.

## Acceptance criteria

- [X] Server world contains terrain plus entity instances after boot.
- [X] Object definition IDs never replace runtime entity IDs.
- [X] Map loading is deterministic.

## Validation commands

- [X] `bun run test`
- [X] `bun run server:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

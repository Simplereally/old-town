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

- [ ] Implement region loader from content registry.
- [ ] Instantiate tiles with height, underlay, overlay, water, bridge, zone, and collision fields.
- [ ] Instantiate placed objects, NPC spawns, ground item spawns, triggers, and resource nodes.
- [ ] Preserve original content definition IDs and runtime entity IDs separately.
- [ ] Add tests for loading the seed 64x64 region.

## Acceptance criteria

- [ ] Server world contains terrain plus entity instances after boot.
- [ ] Object definition IDs never replace runtime entity IDs.
- [ ] Map loading is deterministic.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run server:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

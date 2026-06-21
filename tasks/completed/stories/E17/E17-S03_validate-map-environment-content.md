# E17-S03 — Validate Map Environment Content

## Epic

E17 — Map Environment Schema Gaps

## Dependency chain

- Depends on: E17-S02
- Blocks: none

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- docs/content/map-regions.md

## Objective

Update starter region maps with resource node spawns, player spawn points, and death respawn points. Validate all map content passes `bun run content:validate`.

## Implementation checklist

- [X] Update `content/maps/` starter region map JSON files to include `resourceNodeSpawns` arrays.
- [X] Update `content/maps/` starter region map JSON files to include `playerSpawnPoints` arrays.
- [X] Update `content/maps/` starter region map JSON files to include `deathRespawnPoints` arrays.
- [X] Add at least 3 resource node spawns to each starter region map.
- [X] Add at least 1 player spawn point to each starter region map.
- [X] Add at least 1 death respawn point to each starter region map.
- [X] Write a passing integration test for map content validation.
- [X] Run `bun run content:validate` and fix any errors.

## Acceptance criteria

- [X] Starter region maps include resource node spawns.
- [X] Starter region maps include player spawn points.
- [X] Starter region maps include death respawn points.
- [X] `bun run content:validate` passes with zero errors.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run content:validate`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E17/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

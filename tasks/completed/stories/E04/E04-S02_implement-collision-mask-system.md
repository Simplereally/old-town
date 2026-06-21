# E04-S02 — Implement collision mask system

## Epic

E04 — World Map, Collision, Movement, and Pathfinding

## Dependency chain

- Depends on: E04-S01
- Blocks: next story in `E04` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §6
- POC_SPEC.md §11
- POC_SPEC.md §12

## Objective

Represent movement, line-of-sight, projectile, full-block, and dynamic occupancy using bitmasks.

## Implementation checklist

- [X] Implement CollisionFlag enum and helpers.
- [X] Compute static collision from map/object placements.
- [X] Apply dynamic collision for doors, objects, NPC footprints, and optional player occupancy.
- [X] Implement canStep and canOccupy checks.
- [X] Add tests for cardinal blocks, diagonal clipping, full blocks, LoS blocks, projectile blocks, and footprints.

## Acceptance criteria

- [X] Collision logic uses bitmasks, not physics engine colliders.
- [X] Diagonal movement cannot clip around blocked corners.
- [X] Dynamic collision can be applied and reverted.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

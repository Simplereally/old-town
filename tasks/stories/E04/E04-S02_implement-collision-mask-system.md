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

- [ ] Implement CollisionFlag enum and helpers.
- [ ] Compute static collision from map/object placements.
- [ ] Apply dynamic collision for doors, objects, NPC footprints, and optional player occupancy.
- [ ] Implement canStep and canOccupy checks.
- [ ] Add tests for cardinal blocks, diagonal clipping, full blocks, LoS blocks, projectile blocks, and footprints.

## Acceptance criteria

- [ ] Collision logic uses bitmasks, not physics engine colliders.
- [ ] Diagonal movement cannot clip around blocked corners.
- [ ] Dynamic collision can be applied and reverted.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E10-S05 — Implement death, drops, ground items, and ownership

## Epic

E10 — NPC AI, Combat, Death, Drops, and Respawn

## Dependency chain

- Depends on: E10-S04
- Blocks: next story in `E10` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §14
- POC_SPEC.md §21
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Turn NPC deaths into loot, respawn events, and client-visible ground item entities.

## Implementation checklist

- [X] Implement DropTable weighted roll system.
- [X] Spawn GroundItem entities at valid death/drop tile.
- [X] Set private owner visibility and public reveal ticks.
- [X] Implement Pick up ground item intent.
- [X] Despawn items after configured ticks.
- [X] Add audit-style in-memory item transaction records even before DB persistence.
- [X] Add tests for private/public visibility, pickup, despawn, duplicate pickup prevention.

## Acceptance criteria

- [X] Killing goblin or rat creates drops.
- [X] Only eligible player sees private drop before reveal.
- [X] Picked up items enter inventory through InventorySystem only.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

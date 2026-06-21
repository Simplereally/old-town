# E04-S05 — Implement interaction reach resolution

## Epic

E04 — World Map, Collision, Movement, and Pathfinding

## Dependency chain

- Depends on: E04-S04
- Blocks: next story in `E04` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §6
- POC_SPEC.md §11
- POC_SPEC.md §12

## Objective

Resolve object/NPC/item/spell interactions into reachable interaction tiles before executing actions.

## Implementation checklist

- [X] Implement footprint-aware distance checks.
- [X] Implement nearest interaction tile search around object/NPC footprints.
- [X] Implement optional LoS requirement checks.
- [X] Path to interaction tile when out of range.
- [X] Once in range, enqueue the intended action.
- [X] Add tests for tree adjacency, NPC melee reach, ranged reach, blocked LoS, and unreachable targets.

## Acceptance criteria

- [X] Interaction commands never execute while out of valid range.
- [X] The server decides the interaction tile, not the client.
- [X] Facing target updates are emitted when required.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

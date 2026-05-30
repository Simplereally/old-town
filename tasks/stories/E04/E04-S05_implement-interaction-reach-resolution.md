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

- [ ] Implement footprint-aware distance checks.
- [ ] Implement nearest interaction tile search around object/NPC footprints.
- [ ] Implement optional LoS requirement checks.
- [ ] Path to interaction tile when out of range.
- [ ] Once in range, enqueue the intended action.
- [ ] Add tests for tree adjacency, NPC melee reach, ranged reach, blocked LoS, and unreachable targets.

## Acceptance criteria

- [ ] Interaction commands never execute while out of valid range.
- [ ] The server decides the interaction tile, not the client.
- [ ] Facing target updates are emitted when required.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E10-S01 — Implement NPC spawn, wander, leash, and respawn AI

## Epic

E10 — NPC AI, Combat, Death, Drops, and Respawn

## Dependency chain

- Depends on: E09-S05
- Blocks: next story in `E10` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §14
- POC_SPEC.md §21
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Make content-defined NPCs exist, wander, acquire targets if aggressive, return home, die, and respawn.

## Implementation checklist

- [ ] Spawn NPCs from map content with home tile and radius.
- [ ] Implement Idle, Wander, Aggro, Chase, Attack, ReturnHome, Dead, Respawning states.
- [ ] Respect NPC footprint collision.
- [ ] Clear occupancy on death.
- [ ] Respawn after content-defined ticks.
- [ ] Add tests for wander bounds, leash return, death->respawn.

## Acceptance criteria

- [ ] NPC behavior is deterministic under seeded RNG.
- [ ] NPCs do not wander outside configured radius.
- [ ] Dead NPCs cannot be attacked again before respawn.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

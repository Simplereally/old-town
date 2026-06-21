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

- [X] Spawn NPCs from map content with home tile and radius.
- [X] Implement Idle, Wander, Aggro, Chase, Attack, ReturnHome, Dead, Respawning states.
- [X] Respect NPC footprint collision.
- [X] Clear occupancy on death.
- [X] Respawn after content-defined ticks.
- [X] Add tests for wander bounds, leash return, death->respawn.

## Acceptance criteria

- [X] NPC behavior is deterministic under seeded RNG.
- [X] NPCs do not wander outside configured radius.
- [X] Dead NPCs cannot be attacked again before respawn.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

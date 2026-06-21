# E15-S04 — Add performance and leak checks

## Epic

E15 — POC Assembly, Integration Tests, Performance, and Final Hardening

## Dependency chain

- Depends on: E15-S03
- Blocks: next story in `E15` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §26
- POC_SPEC.md §27
- POC_SPEC.md §28
- POC_SPEC.md §29
- POC_SPEC.md §30

## Objective

Ensure the POC stays efficient enough for a web MMO foundation.

## Implementation checklist

- [X] Add client debug counters for draw calls, geometries, textures, actors, objects, chunks, and frame time.
- [X] Add server debug counters for tick duration, entity count, command count, delta size, and save queue size.
- [X] Pool or dispose render resources on chunk/entity removal.
- [X] Add stress script for simulated players/NPCs where practical.
- [X] Document observed limits and current bottlenecks.

## Acceptance criteria

- [X] Chunk unload does not leak obvious Three.js resources.
- [X] Server tick duration is visible and bounded in dev counters.
- [X] Delta sizes are observable.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E14-S05 — Implement pathing, LoS, and interaction probe tools

## Epic

E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E14-S04
- Blocks: next story in `E14` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Add editor probes that verify the exact primitives most likely to break gameplay.

## Implementation checklist

- [X] Add path probe from tile A to tile B using shared/server pathfinding package.
- [X] Add LoS probe using shared/server collision checks.
- [X] Add interaction reach probe for object/NPC footprints.
- [X] Display resulting path/ray/reach tiles.
- [X] Export probe test fixtures for automated regression tests.

## Acceptance criteria

- [X] Designer/agent can debug blocked movement without launching full game.
- [X] Probe logic reuses production path/LoS code.
- [X] Probe fixtures can be added to tests.

## Validation commands

- [X] `bun run world-editor:dev`
- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E01-S02 — Define constants and deterministic math utilities

## Epic

E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E01-S01
- Blocks: next story in `E01` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Objective

Centralize core constants and non-render math used by simulation and client.

## Implementation checklist

- [X] Define GAME_TICK_MS = 600, CHUNK_SIZE = 8, REGION_SIZE = 64, ACTIVE_SCENE_SIZE = 104, PLANES = 4.
- [X] Implement clamp, random integer interface, Manhattan/Chebyshev distance helpers.
- [X] Implement Direction enum and direction-from-delta helpers.
- [X] Add deterministic seeded RNG interface for systems that need reproducible tests.
- [X] Add unit tests for distances and direction rules.

## Acceptance criteria

- [X] No duplicate hardcoded tick/chunk constants exist outside shared constants.
- [X] Math helpers are pure and unit-tested.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E01/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

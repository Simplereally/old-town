# E13-S01 — Define persistence adapter interface and dev storage

## Epic

E13 — Persistence, Character Save/Load, and Item Audit

## Dependency chain

- Depends on: E12-S05
- Blocks: next story in `E13` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §20
- POC_SPEC.md §21
- POC_SPEC.md §25
- POC_SPEC.md §27

## Objective

Create a persistence boundary that supports in-memory/dev JSON now and PostgreSQL later without leaking DB details into systems.

## Implementation checklist

- [X] Define PersistenceAdapter interface.
- [X] Implement in-memory adapter for tests.
- [X] Implement JSON-file dev adapter for local play.
- [X] Define CharacterSnapshot schema.
- [X] Add tests for save/load roundtrip.

## Acceptance criteria

- [X] Simulation systems depend on adapter interface, not a concrete DB client.
- [X] Dev persistence can be disabled/enabled by config.
- [X] Snapshots validate before save and after load.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

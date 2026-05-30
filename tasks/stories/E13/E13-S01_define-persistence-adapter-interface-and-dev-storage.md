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

- [ ] Define PersistenceAdapter interface.
- [ ] Implement in-memory adapter for tests.
- [ ] Implement JSON-file dev adapter for local play.
- [ ] Define CharacterSnapshot schema.
- [ ] Add tests for save/load roundtrip.

## Acceptance criteria

- [ ] Simulation systems depend on adapter interface, not a concrete DB client.
- [ ] Dev persistence can be disabled/enabled by config.
- [ ] Snapshots validate before save and after load.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

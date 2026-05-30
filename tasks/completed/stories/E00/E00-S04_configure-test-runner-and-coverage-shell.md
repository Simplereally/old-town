# E00-S04 — Configure test runner and coverage shell

## Epic

E00 — Repository Foundation and Quality Gates

## Dependency chain

- Depends on: E00-S03
- Blocks: next story in `E00` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26
- POC_SPEC.md §27

## Objective

Create a test setup that every future engine primitive can use.

## Implementation checklist

- [X] Install Vitest or equivalent.
- [X] Create root test config covering shared, server, and tools packages.
- [X] Add `test`, `test:watch`, and `test:coverage` scripts.
- [X] Add one smoke test per package proving the runner loads aliases.
- [X] Ensure tests run in deterministic timezone/locale settings where practical.

## Acceptance criteria

- [X] `bun run test` passes.
- [X] Smoke tests import from packages/shared successfully.
- [X] Coverage command executes without failing on empty coverage thresholds.

## Validation commands

- [X] `bun run test`
- [X] `bun run test:coverage`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E00/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

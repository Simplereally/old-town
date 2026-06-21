# E15-S02 — Write movement, interaction, and networking integration tests

## Epic

E15 — POC Assembly, Integration Tests, Performance, and Final Hardening

## Dependency chain

- Depends on: E15-S01
- Blocks: next story in `E15` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §26
- POC_SPEC.md §27
- POC_SPEC.md §28
- POC_SPEC.md §29
- POC_SPEC.md §30

## Objective

Validate the multiplayer engine loop across command transport, server tick, movement, deltas, and client-consumable packets.

## Implementation checklist

- [X] Test connect/bootstrap full state.
- [X] Test click-to-move command through tick delta.
- [X] Test blocked movement rejection.
- [X] Test object interaction path-to-reach.
- [X] Test two-session visibility and interest filtering.
- [X] Test chunk boundary load/unload.

## Acceptance criteria

- [X] Integration tests exercise real command/delta contracts.
- [X] Movement and interest regressions fail tests.
- [X] Tests do not require a browser where not necessary.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

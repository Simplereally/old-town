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

- [ ] Test connect/bootstrap full state.
- [ ] Test click-to-move command through tick delta.
- [ ] Test blocked movement rejection.
- [ ] Test object interaction path-to-reach.
- [ ] Test two-session visibility and interest filtering.
- [ ] Test chunk boundary load/unload.

## Acceptance criteria

- [ ] Integration tests exercise real command/delta contracts.
- [ ] Movement and interest regressions fail tests.
- [ ] Tests do not require a browser where not necessary.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E15-S03 — Write gameplay loop integration tests

## Epic

E15 — POC Assembly, Integration Tests, Performance, and Final Hardening

## Dependency chain

- Depends on: E15-S02
- Blocks: next story in `E15` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §26
- POC_SPEC.md §27
- POC_SPEC.md §28
- POC_SPEC.md §29
- POC_SPEC.md §30

## Objective

Validate inventory, skilling, combat, magic, drops, quest, and persistence as a coherent game loop.

## Implementation checklist

- [X] Test chop tree -> logs -> XP -> depletion -> respawn.
- [X] Test mine rock -> ore -> XP.
- [X] Test attack goblin -> damage -> death -> private drop -> pickup.
- [X] Test cast spell -> bead cost -> projectile -> delayed hit.
- [X] Test complete Smoke Over Old Town quest.
- [X] Test refresh/reconnect preserves character progress in dev persistence mode.

## Acceptance criteria

- [X] The POC fantasy in POC_SPEC.md §1 and §29 is mechanically complete.
- [X] Gameplay systems use shared primitives and content definitions.
- [X] Critical loops are regression-tested.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

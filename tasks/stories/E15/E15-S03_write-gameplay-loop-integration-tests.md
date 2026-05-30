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

- [ ] Test chop tree -> logs -> XP -> depletion -> respawn.
- [ ] Test mine rock -> ore -> XP.
- [ ] Test attack goblin -> damage -> death -> private drop -> pickup.
- [ ] Test cast spell -> rune cost -> projectile -> delayed hit.
- [ ] Test complete Smoke Over Old Town quest.
- [ ] Test refresh/reconnect preserves character progress in dev persistence mode.

## Acceptance criteria

- [ ] The POC fantasy in POC_SPEC.md §1 and §29 is mechanically complete.
- [ ] Gameplay systems use shared primitives and content definitions.
- [ ] Critical loops are regression-tested.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

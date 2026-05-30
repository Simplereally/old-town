# E08-S05 — Implement character skills and derived stats

## Epic

E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E08-S04
- Blocks: next story in `E08` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Objective

Represent skill XP, levels, current boosted/drained stats, HP, and base combat calculations.

## Implementation checklist

- [ ] Create SkillStateComponent.
- [ ] Initialize starter skills from content.
- [ ] Implement addXp and level-up detection.
- [ ] Implement current/max HP fields tied to hitpoints level.
- [ ] Implement base combat level calculation helper.
- [ ] Emit SkillDelta and XP drop packets.
- [ ] Add tests for XP gain, level-up, HP max changes, and combat level.

## Acceptance criteria

- [ ] XP table from content is used.
- [ ] Level-ups cannot double-fire for same XP change.
- [ ] Skill deltas update client skills panel.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

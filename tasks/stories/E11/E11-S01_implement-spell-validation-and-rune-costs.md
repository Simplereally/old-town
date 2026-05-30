# E11-S01 — Implement spell validation and rune costs

## Epic

E11 — Magic, Projectiles, Line of Sight, and Teleports

## Dependency chain

- Depends on: E10-S05
- Blocks: next story in `E11` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §5
- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §17
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Validate magic level, rune inventory, target type, range, LoS, cooldown, and spellbook membership for SpellIntent.

## Implementation checklist

- [ ] Implement SpellIntent handler.
- [ ] Validate spell exists and player has required magic level.
- [ ] Validate and consume rune costs only on successful cast start.
- [ ] Validate target type and range.
- [ ] Check LoS when configured.
- [ ] Emit server messages for invalid casts.
- [ ] Add tests for missing runes, low level, wrong target, blocked LoS.

## Acceptance criteria

- [ ] Client cannot cast by bypassing rune/level checks.
- [ ] Rune consumption is transactional with cast start.
- [ ] Invalid casts do not consume runes.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

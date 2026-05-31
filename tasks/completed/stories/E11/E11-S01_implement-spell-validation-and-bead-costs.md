# E11-S01 — Implement spell validation and bead costs

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

Validate magic level, bead inventory, target type, range, LoS, cooldown, and spellbook membership for SpellIntent.

## Implementation checklist

- [X] Implement SpellIntent handler.
- [X] Validate spell exists and player has required magic level.
- [X] Validate and consume bead costs only on successful cast start.
- [X] Validate target type and range.
- [X] Check LoS when configured.
- [X] Emit server messages for invalid casts.
- [X] Add tests for missing beads, low level, wrong target, blocked LoS.

## Acceptance criteria

- [X] Client cannot cast by bypassing rune/level checks.
- [X] Bead consumption is transactional with cast start.
- [X] Invalid casts do not consume beads.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

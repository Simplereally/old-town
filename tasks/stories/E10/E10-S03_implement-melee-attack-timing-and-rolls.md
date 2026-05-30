# E10-S03 — Implement melee attack timing and rolls

## Epic

E10 — NPC AI, Combat, Death, Drops, and Respawn

## Dependency chain

- Depends on: E10-S02
- Blocks: next story in `E10` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §14
- POC_SPEC.md §21
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Resolve weapon-speed attack intervals, hit chance, max hit, and delayed hit events.

## Implementation checklist

- [ ] Use equipment weapon speed or default unarmed speed.
- [ ] Compute attack and defence rolls from levels and bonuses.
- [ ] Compute hit chance and max hit.
- [ ] Enqueue PendingHit with explicit applyTick.
- [ ] Play attack animation update mask.
- [ ] Add tests for attack intervals, roll boundaries, weapon swap speed update.

## Acceptance criteria

- [ ] Attack cadence is integer tick-based.
- [ ] Damage is never applied by animation completion.
- [ ] Roll formulas are deterministic under test RNG.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

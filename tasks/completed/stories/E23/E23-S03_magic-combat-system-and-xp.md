# E23-S03 — Magic Combat System and XP

## Epic

E23 — Spell Effects and Magic Combat

## Dependency chain

- Depends on: E23-S02
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 23)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §11 (Magic & Spells)

## Objective

Implement the full magic combat system: magic defence rolls, magic accuracy, and magic XP. This closes the gap where melee combat works but magic combat has no defence calculation or XP progression.

## Implementation checklist

- [X] Write a failing test for magic combat system in `apps/server/src/systems/__tests__/magic-combat.test.ts`.
- [X] Extend combat system with magic attack and defence rolls.
- [X] Implement magic attack roll: `magicLevel + magicBonus + spellAccuracy`.
- [X] Implement magic defence roll: `magicDefenceLevel + magicDefenceBonus`.
- [X] Implement magic damage roll: `spellDamage + random(0, maxHit)`.
- [X] Implement magic XP on cast and on hit (split: offence + defence).
- [X] Write a passing test for magic attack roll.
- [X] Write a passing test for magic defence roll.
- [X] Write a passing test for magic damage roll.
- [X] Write a passing test for magic XP award.

## Acceptance criteria

- [X] Magic attack and defence rolls are calculated correctly.
- [X] Magic damage is applied using the combat formula.
- [X] Magic XP is awarded for both casting and hitting.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E23/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

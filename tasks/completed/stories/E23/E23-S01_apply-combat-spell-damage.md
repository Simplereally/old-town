# E23-S01 — Apply Combat Spell Damage

## Epic

E23 — Spell Effects and Magic Combat

## Dependency chain

- Depends on: E11-S02
- Blocks: E23-S02, E23-S03

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 4)
- docs/content/action-wiring-audit.md (action IDs: `cast`)
- POC_SPEC.md §11 (Magic & Spells)

## Objective

Implement combat spell damage application. After spell validation succeeds, apply the spell's damage to the target entity using the magic combat formula.

## Implementation checklist

- [X] Write a failing test for spell damage application in `apps/server/src/systems/__tests__/spell-damage.test.ts`.
- [X] Extend `spell-system.ts` with `applySpellEffect` function.
- [X] Implement damage calculation: `spellDamage = baseDamage + magicBonus * spellPower`.
- [X] Apply damage to target health component (same as melee damage path).
- [X] Generate hitsplat for spell damage.
- [X] Award magic XP on successful spell hit.
- [X] Write a passing test for spell damage calculation.
- [X] Write a passing test for spell damage application.
- [X] Write a passing test for spell hitsplat generation.
- [X] Write a passing test for magic XP award.

## Acceptance criteria

- [X] Spell damage is calculated and applied to target.
- [X] Spell damage generates hitsplat.
- [X] Magic XP is awarded on successful spell hit.
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

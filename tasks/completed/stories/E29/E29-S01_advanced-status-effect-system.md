# E29-S01 — Advanced Status Effect System

## Epic

E29 — Advanced Status Effects and Combat

## Dependency chain

- Depends on: E18-S03, E23-S03
- Blocks: E29-S02

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 22)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §10 (Combat & Status)

## Objective

Implement advanced status effects: poison, burn, freeze, buffs, and debuffs. Extend the existing status system beyond `bind`.

## Implementation checklist

- [X] Write a failing test for advanced status effects in `apps/server/src/systems/__tests__/status-effects.test.ts`.
- [X] Extend `status-system.ts` (or create) with advanced effect types.
- [X] Implement poison: periodic damage over time, curable with antidote.
- [X] Implement burn: periodic damage, reduced by water.
- [X] Implement freeze: movement block, reduced by fire damage.
- [X] Implement buffs: temporary stat boosts (strength, defence, speed).
- [X] Implement debuffs: temporary stat reductions.
- [X] Implement effect stacking rules: max stacks, duration refresh.
- [X] Write a passing test for poison.
- [X] Write a passing test for burn.
- [X] Write a passing test for freeze.
- [X] Write a passing test for buff/debuff.
- [X] Write a passing test for effect stacking.

## Acceptance criteria

- [X] All advanced status effects are implemented.
- [X] Effects stack correctly with rules.
- [X] Periodic effects apply on tick.
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
- [X] Move this story file to `tasks/completed/stories/E29/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

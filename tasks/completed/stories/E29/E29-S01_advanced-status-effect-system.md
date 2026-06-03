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

- [ ] Write a failing test for advanced status effects in `apps/server/src/systems/__tests__/status-effects.test.ts`.
- [ ] Extend `status-system.ts` (or create) with advanced effect types.
- [ ] Implement poison: periodic damage over time, curable with antidote.
- [ ] Implement burn: periodic damage, reduced by water.
- [ ] Implement freeze: movement block, reduced by fire damage.
- [ ] Implement buffs: temporary stat boosts (strength, defence, speed).
- [ ] Implement debuffs: temporary stat reductions.
- [ ] Implement effect stacking rules: max stacks, duration refresh.
- [ ] Write a passing test for poison.
- [ ] Write a passing test for burn.
- [ ] Write a passing test for freeze.
- [ ] Write a passing test for buff/debuff.
- [ ] Write a passing test for effect stacking.

## Acceptance criteria

- [ ] All advanced status effects are implemented.
- [ ] Effects stack correctly with rules.
- [ ] Periodic effects apply on tick.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E29/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

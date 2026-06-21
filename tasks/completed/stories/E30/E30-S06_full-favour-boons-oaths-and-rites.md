# E30-S06 — Full Favour Boons, Oaths, and Rites

## Epic

E30 — World Expansion Systems

## Dependency chain

- Depends on: E30-S05, E25-S02
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 21)
- docs/favour/boons-oaths-rites.md

## Objective

Implement the full Favour system: boons, oaths, and rites. Extend the Favour-lite offering system with advanced religious mechanics.

## Implementation checklist

- [X] Write a failing test for full favour in `apps/server/src/systems/__tests__/full-favour.test.ts`.
- [X] Create `favour-advanced-system.ts` in `apps/server/src/systems/`.
- [X] Define boon schema: `id`, `name`, `requiredFavour`, `effect`, `duration`.
- [X] Implement boon activation: consume favour, apply buff effect.
- [X] Define oath schema: `id`, `name`, `requiredFavour`, `restriction`, `benefit`.
- [X] Implement oath binding: player accepts restriction, gains benefit.
- [X] Define rite schema: `id`, `name`, `requiredFavour`, `requiredItems`, `outcome`.
- [X] Implement rite performance: consume items, trigger outcome.
- [X] Write a passing test for boon activation.
- [X] Write a passing test for oath binding.
- [X] Write a passing test for rite performance.
- [X] Write a passing test for favour cost deduction.

## Acceptance criteria

- [X] Boons apply buff effects.
- [X] Oaths apply restrictions and benefits.
- [X] Rites consume items and trigger outcomes.
- [X] All favour costs are deducted.
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
- [X] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

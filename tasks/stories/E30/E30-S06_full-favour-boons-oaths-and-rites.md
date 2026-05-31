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

- [ ] Write a failing test for full favour in `apps/server/src/systems/__tests__/full-favour.test.ts`.
- [ ] Create `favour-advanced-system.ts` in `apps/server/src/systems/`.
- [ ] Define boon schema: `id`, `name`, `requiredFavour`, `effect`, `duration`.
- [ ] Implement boon activation: consume favour, apply buff effect.
- [ ] Define oath schema: `id`, `name`, `requiredFavour`, `restriction`, `benefit`.
- [ ] Implement oath binding: player accepts restriction, gains benefit.
- [ ] Define rite schema: `id`, `name`, `requiredFavour`, `requiredItems`, `outcome`.
- [ ] Implement rite performance: consume items, trigger outcome.
- [ ] Write a passing test for boon activation.
- [ ] Write a passing test for oath binding.
- [ ] Write a passing test for rite performance.
- [ ] Write a passing test for favour cost deduction.

## Acceptance criteria

- [ ] Boons apply buff effects.
- [ ] Oaths apply restrictions and benefits.
- [ ] Rites consume items and trigger outcomes.
- [ ] All favour costs are deducted.
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
- [ ] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

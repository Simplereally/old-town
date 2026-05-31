# E29-S02 — Drop Table Rarity and Conditionals

## Epic

E29 — Advanced Status Effects and Combat

## Dependency chain

- Depends on: E29-S01
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 25)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §10 (Combat & Drops)

## Objective

Implement drop table rarity and conditionals. Extend the existing flat-weight drop table to support rarity tiers, conditional drops, and guaranteed drops.

## Implementation checklist

- [ ] Write a failing test for drop table conditionals in `apps/server/src/systems/__tests__/drop-table.test.ts`.
- [ ] Extend `rollDropTable` with rarity tiers: `common`, `uncommon`, `rare`, `very_rare`, `guaranteed`.
- [ ] Implement conditional drops: only drop if player has quest, level, or item.
- [ ] Implement guaranteed drops: always drop if condition is met.
- [ ] Implement rarity weight scaling: multiply base weight by rarity multiplier.
- [ ] Write a passing test for rarity tier drop.
- [ ] Write a passing test for conditional drop.
- [ ] Write a passing test for guaranteed drop.
- [ ] Write a passing test for rarity weight scaling.

## Acceptance criteria

- [ ] Rarity tiers are supported.
- [ ] Conditional drops work.
- [ ] Guaranteed drops work.
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

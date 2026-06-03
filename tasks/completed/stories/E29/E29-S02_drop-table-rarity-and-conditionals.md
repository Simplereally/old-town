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

- [X] Write a failing test for drop table conditionals in `apps/server/src/systems/__tests__/drop-table.test.ts`.
- [X] Extend `rollDropTable` with rarity tiers: `common`, `uncommon`, `rare`, `very_rare`, `guaranteed`.
- [X] Implement conditional drops: only drop if player has quest, level, or item.
- [X] Implement guaranteed drops: always drop if condition is met.
- [X] Implement rarity weight scaling: multiply base weight by rarity multiplier.
- [X] Write a passing test for rarity tier drop.
- [X] Write a passing test for conditional drop.
- [X] Write a passing test for guaranteed drop.
- [X] Write a passing test for rarity weight scaling.

## Acceptance criteria

- [X] Rarity tiers are supported.
- [X] Conditional drops work.
- [X] Guaranteed drops work.
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

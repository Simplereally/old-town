# E39-S02 — Drop Table Rarity and Conditional Drops

## Epic

E39 — World Expansion and Exploration Systems

## Dependency chain

- Depends on: E39-S01
- Blocks: E39-S03

## Spec references

- P2 gap 17: Equipment appearance system
- P2 gap 18: Drop table rarity / conditionals
- P2 gap 13: Nooks
- P2 gap 11: Ledger deeds

## Objective

Extend drop table system with rarity tiers, conditional drops, and luck modifiers. Update rollDropTable logic.

## Implementation checklist
- [X] Create/modify: apps/server/src/systems/drop-table.ts
- [X] Create/modify: content/drops/starter-drops.json
- [X] Create/modify: packages/shared/src/content-schemas/drop-table.ts
- [X] Write test: Rarity tier test
- [X] Write test: Conditional drop test
- [X] Write test: Luck modifier test

## Acceptance criteria
- [X] Rarity tier test passes
- [X] Conditional drop test passes
- [X] Luck modifier test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E39/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

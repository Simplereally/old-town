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
- [ ] Create/modify: apps/server/src/systems/drop-table.ts
- [ ] Create/modify: content/drops/starter-drops.json
- [ ] Create/modify: packages/shared/src/content-schemas/drop-table.ts
- [ ] Write test: Rarity tier test
- [ ] Write test: Conditional drop test
- [ ] Write test: Luck modifier test

## Acceptance criteria
- [ ] Rarity tier test passes
- [ ] Conditional drop test passes
- [ ] Luck modifier test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E39/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

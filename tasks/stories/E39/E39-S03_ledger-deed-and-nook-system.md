# E39-S03 — Ledger Deed and Nook System

## Epic

E39 — World Expansion and Exploration Systems

## Dependency chain

- Depends on: E39-S02
- Blocks: (epic end)

## Spec references

- P2 gap 17: Equipment appearance system
- P2 gap 18: Drop table rarity / conditionals
- P2 gap 13: Nooks
- P2 gap 11: Ledger deeds

## Objective

Create ledger deed schema (deed_type, location, owner, build_materials), implement nook discovery (hidden area objects with storage flag), and wire ledger UI.

## Implementation checklist
- [ ] Create/modify: apps/server/src/systems/ledger-system.ts
- [ ] Create/modify: apps/server/src/ecs/components.ts
- [ ] Create/modify: content/ledger/starter-ledger.json
- [ ] Create/modify: content/objects/starter-objects.json
- [ ] Write test: Deed creation test
- [ ] Write test: Nook discovery test
- [ ] Write test: Storage access test

## Acceptance criteria
- [ ] Deed creation test passes
- [ ] Nook discovery test passes
- [ ] Storage access test passes

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

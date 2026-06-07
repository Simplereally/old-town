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
- [X] Create/modify: apps/server/src/systems/ledger-system.ts
- [X] Create/modify: apps/server/src/ecs/components.ts
- [X] Create/modify: content/ledger/starter-ledger.json
- [X] Create/modify: content/objects/starter-objects.json
- [X] Write test: Deed creation test
- [X] Write test: Nook discovery test
- [X] Write test: Storage access test

## Acceptance criteria
- [X] Deed creation test passes
- [X] Nook discovery test passes
- [X] Storage access test passes

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

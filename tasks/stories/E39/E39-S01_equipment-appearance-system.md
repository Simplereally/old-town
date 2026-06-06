# E39-S01 — Equipment Appearance System

## Epic

E39 — World Expansion and Exploration Systems

## Dependency chain

- Depends on: (epic start)
- Blocks: E39-S02

## Spec references

- P2 gap 17: Equipment appearance system
- P2 gap 18: Drop table rarity / conditionals
- P2 gap 13: Nooks
- P2 gap 11: Ledger deeds

## Objective

Map equipment items to appearance IDs. Client should render correct model when item is equipped. Update ClientPacketApplier to apply appearance changes.

## Implementation checklist
- [ ] Create/modify: apps/server/src/systems/appearance-system.ts
- [ ] Create/modify: apps/client/src/game/net/ClientPacketApplier.ts
- [ ] Create/modify: apps/client/src/game/renderer/ThreeRenderer.ts
- [ ] Create/modify: content/items/*.json
- [ ] Write test: Equipment appearance mapping test
- [ ] Write test: Appearance packet test
- [ ] Write test: Model render test

## Acceptance criteria
- [ ] Equipment appearance mapping test passes
- [ ] Appearance packet test passes
- [ ] Model render test passes

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

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
- [X] Create/modify: apps/server/src/systems/appearance-system.ts
- [X] Create/modify: apps/client/src/game/net/ClientPacketApplier.ts
- [X] Create/modify: apps/client/src/game/renderer/ThreeRenderer.ts
- [X] Create/modify: content/items/*.json
- [X] Write test: Equipment appearance mapping test
- [X] Write test: Appearance packet test
- [X] Write test: Model render test

## Acceptance criteria
- [X] Equipment appearance mapping test passes
- [X] Appearance packet test passes
- [X] Model render test passes

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

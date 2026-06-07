# E36-S01 — Player Death and Respawn System

## Epic

E36 — Economy Runtime: Bank, Shop, and Death

## Dependency chain

- Depends on: (epic start)
- Blocks: E36-S02

## Spec references

- P0 gap 5: Bank / storage runtime
- P0 gap 6: Death + respawn for players
- P0 gap 7: Shop / trade runtime

## Objective

When player health reaches 0, spawn a grave entity at death tile, store dropped inventory items, empty inventory (or keep 3 most valuable), emit DeathNoticePacket, emit GraveSpawnPacket, respawn after 5 ticks at spawn point, graves despawn after 10 minutes.

## Implementation checklist
- [X] Create/modify: apps/server/src/systems/death-system.ts
- [X] Create/modify: apps/server/src/ecs/components.ts
- [X] Create/modify: apps/server/src/ecs/world.ts
- [X] Write test: DeathSystem respawn test
- [X] Write test: Death penalty test
- [X] Write test: Combat clear on death test

## Acceptance criteria
- [X] DeathSystem respawn test passes
- [X] Death penalty test passes
- [X] Combat clear on death test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E36/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

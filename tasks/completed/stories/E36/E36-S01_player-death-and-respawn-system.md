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
- [ ] Create/modify: apps/server/src/systems/death-system.ts
- [ ] Create/modify: apps/server/src/ecs/components.ts
- [ ] Create/modify: apps/server/src/ecs/world.ts
- [ ] Write test: DeathSystem respawn test
- [ ] Write test: Death penalty test
- [ ] Write test: Combat clear on death test

## Acceptance criteria
- [ ] DeathSystem respawn test passes
- [ ] Death penalty test passes
- [ ] Combat clear on death test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E36/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

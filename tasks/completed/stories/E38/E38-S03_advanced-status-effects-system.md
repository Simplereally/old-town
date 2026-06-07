# E38-S03 — Advanced Status Effects System

## Epic

E38 — Wardenry Contracts and Identity Systems

## Dependency chain

- Depends on: E38-S02
- Blocks: (epic end)

## Spec references

- P1 gap 9: Wardenry contract runtime
- P2 gap 15: Full Favour boons / oaths / rites
- P2 gap 16: Advanced status effects

## Objective

Create status-effect-system.ts with tick phase. Implement StatusEffectComponent: activeEffects with effectId, durationTicks, damagePerTick, healPerTick, statModifiers. Wire consumables.

## Implementation checklist
- [X] Create/modify: apps/server/src/systems/status-effect-system.ts
- [X] Create/modify: apps/server/src/ecs/components.ts
- [X] Create/modify: apps/server/src/sim/simulation-kernel.ts
- [X] Create/modify: apps/server/src/systems/consumable-system.ts
- [X] Create/modify: content/status-effects/starter-status-effects.json
- [X] Write test: DOT application test
- [X] Write test: HOT application test
- [X] Write test: Buff stat modifier test
- [X] Write test: Effect expiration test
- [X] Write test: Consumable effect test

## Acceptance criteria
- [X] DOT application test passes
- [X] HOT application test passes
- [X] Buff stat modifier test passes
- [X] Effect expiration test passes
- [X] Consumable effect test passes

## Validation commands
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E38/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

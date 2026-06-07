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
- [ ] Create/modify: apps/server/src/systems/status-effect-system.ts
- [ ] Create/modify: apps/server/src/ecs/components.ts
- [ ] Create/modify: apps/server/src/sim/simulation-kernel.ts
- [ ] Create/modify: apps/server/src/systems/consumable-system.ts
- [ ] Create/modify: content/status-effects/starter-status-effects.json
- [ ] Write test: DOT application test
- [ ] Write test: HOT application test
- [ ] Write test: Buff stat modifier test
- [ ] Write test: Effect expiration test
- [ ] Write test: Consumable effect test

## Acceptance criteria
- [ ] DOT application test passes
- [ ] HOT application test passes
- [ ] Buff stat modifier test passes
- [ ] Effect expiration test passes
- [ ] Consumable effect test passes

## Validation commands
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E38/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

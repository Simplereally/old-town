# E65-S03 — ActorRenderer decomposition: pooling and animation/equipment

## Epic

E65 — Client Architecture: Decomposing the God Files

## Dependency chain

- Depends on: E65-S02
- Blocks: E65-S04

## Objective

The core clusters: actor instance pooling/lifecycle and the per-frame animation + equipment
attachment update path. After this story ActorRenderer is a thin coordinator.

## Required work

- [ ] Extract pooling/lifecycle (acquire/release of actor visual instances, spawn/despawn
      handling) per the S01 contract.
- [ ] Extract the animation/equipment update cluster (per-frame state application; the E49
      rig's attach points are its interface — the module drives the rig, the rig stays the
      rig's).
- [ ] ActorRenderer post-state: a coordinator that composes the modules and exposes the same
      public surface GameEngine uses today (its public API is frozen this epic — S05 may
      rename; behavior first).
- [ ] Test migration + new unit tests per module; the entity-scale stress test
      (`stress/entity-scale.perf.test.ts`) must show NO regression (pooling is hot-path —
      compare its numbers before/after and record them in the story note; any regression
      > noise gets fixed before merge).
- [ ] Manual pass: animations, equipment swaps, many-actor scenes.

## Acceptance criteria

- [ ] ActorRenderer ≤ ~400 lines of composition; all clusters modular with focused tests.
- [ ] Stress numbers within noise of baseline (recorded).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

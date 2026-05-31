# E35-S04 - Entity Scale Stress Harness

## Epic

E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E35-S03
- Blocks: E35-S05, E35-S06

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/snapshot-interpolation.md
- docs/technical/performance-budgets.md

## Objective

Add a deterministic stress harness for 1k render-cached actors/entities moving through the snapshot/playout/render-transform stack.

## Implementation checklist

- [ ] Write tests in `apps/client/src/game/renderer/stress/entity-scale.stress.test.ts`.
- [ ] Create `apps/client/src/game/renderer/stress/EntityScaleHarness.ts`.
- [ ] Generate 1000 entities with stable ids, deterministic tile paths, and mixed `player`/`npc` kinds.
- [ ] Feed at least 60 server ticks of snapshots through `SnapshotBuffer` and `RenderTransformCache`.
- [ ] Assert `RenderTransformCache` capacity growth preserves entity mapping and does not expose stale removed entities.
- [ ] Assert per-frame iteration over 1000 presentations avoids array allocation in the hot loop.
- [ ] Assert frame metrics record entity count and transform update duration.
- [ ] If WebGL is available in the test environment, render using actor pools; otherwise test the pure transform/cache path and mark visual draw-call measurement as manual/browser-only.
- [ ] Document the manual browser command or route needed to inspect 1k actor rendering if CI cannot cover WebGL.

## Acceptance criteria

- [ ] 1k entities can be sampled and iterated deterministically.
- [ ] Removed entities disappear from presentation iteration.
- [ ] Transform cache tests prove no Three objects live in hot state.
- [ ] Metrics include entity count and transform sampling/update duration.
- [ ] CI coverage is pure and deterministic; browser-only rendering gaps are explicitly documented.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/stress/entity-scale.stress.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run render:boundaries`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

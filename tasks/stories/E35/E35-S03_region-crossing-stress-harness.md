# E35-S03 - Region Crossing Stress Harness

## Epic

E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E35-S02
- Blocks: E35-S04, E35-S05, E35-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- POC_SPEC.md §6

## Objective

Add a stress harness for repeated region crossing under jittered packets, worker bake completion reordering, upload budget pressure, and LRU eviction.

## Implementation checklist

- [ ] Write tests in `apps/client/src/game/renderer/stress/region-crossing.stress.test.ts`.
- [ ] Create `apps/client/src/game/renderer/stress/RegionCrossingHarness.ts`.
- [ ] Generate a deterministic path that crosses at least four region boundaries and revisits at least one evicted region.
- [ ] Generate region load/unload packets with jitter relative to entity snapshots.
- [ ] Simulate worker bake completion out of order.
- [ ] Simulate upload budget exhaustion for multiple consecutive frames.
- [ ] Assert visible chunks eventually reach `visible` state without packet-callback upload.
- [ ] Assert unloaded chunks cancel queued work, evict resident resources, or dispose resources according to lifecycle state.
- [ ] Assert re-entered disposed chunks are requeued for bake/upload.
- [ ] Assert diagnostics expose queue depth and lifecycle counts throughout the run.

## Acceptance criteria

- [ ] Region crossing works when loads, unloads, entity adds, and bake completions arrive out of order.
- [ ] No large geometry upload happens inside packet ingestion.
- [ ] Upload budget pressure delays visibility without corrupting pure client state.
- [ ] LRU eviction and re-entry are covered.
- [ ] Test data is deterministic and can run without real workers by using injected fake worker completion.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/stress/region-crossing.stress.test.ts`
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

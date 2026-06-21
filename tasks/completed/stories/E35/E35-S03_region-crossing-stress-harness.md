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

- [X] Write tests in `apps/client/src/game/renderer/stress/region-crossing.stress.test.ts`.
- [X] Create `apps/client/src/game/renderer/stress/RegionCrossingHarness.ts`.
- [X] Generate a deterministic path that crosses at least four region boundaries and revisits at least one evicted region.
- [X] Generate region load/unload packets with jitter relative to entity snapshots.
- [X] Simulate worker bake completion out of order.
- [X] Simulate upload budget exhaustion for multiple consecutive frames.
- [X] Assert visible chunks eventually reach `visible` state without packet-callback upload.
- [X] Assert unloaded chunks cancel queued work, evict resident resources, or dispose resources according to lifecycle state.
- [X] Assert re-entered disposed chunks are requeued for bake/upload.
- [X] Assert diagnostics expose queue depth and lifecycle counts throughout the run.

## Acceptance criteria

- [X] Region crossing works when loads, unloads, entity adds, and bake completions arrive out of order.
- [X] No large geometry upload happens inside packet ingestion.
- [X] Upload budget pressure delays visibility without corrupting pure client state.
- [X] LRU eviction and re-entry are covered.
- [X] Test data is deterministic and can run without real workers by using injected fake worker completion.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/stress/region-crossing.stress.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run render:boundaries`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

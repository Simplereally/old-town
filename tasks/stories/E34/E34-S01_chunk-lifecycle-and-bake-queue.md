# E34-S01 - Chunk Lifecycle and Bake Queue

## Epic

E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E33-S06
- Blocks: E34-S02, E34-S03, E34-S04, E34-S05, E34-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- POC_SPEC.md §6
- POC_SPEC.md §8.5

## Objective

Implement the pure chunk lifecycle state machine and `ChunkBakeQueue` that region load packets enqueue into, without performing worker or GPU upload work yet.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/ChunkBakeQueue.test.ts`.
- [ ] Create `apps/client/src/game/renderer/ChunkBakeQueue.ts`.
- [ ] Export `ChunkLifecycleState`, `ChunkBakeQueue`, `ChunkBakeJob`, `ChunkBakePriority`, and `ChunkBakeQueueStats`.
- [ ] Implement states exactly: `unseen`, `metadata_loaded`, `bake_requested`, `baking_worker`, `baked_waiting_gpu_upload`, `gpu_resident`, `visible`, `hidden_resident`, `evict_pending`, and `disposed`.
- [ ] Implement `ingestRegionLoad(regionId, chunks)` that creates/updates metadata and queues bake jobs without touching Three.
- [ ] Implement `ingestRegionUnload(regionId)` that marks matching chunks `evict_pending` or `disposed` according to residency state.
- [ ] Implement job priority from distance to focus tile, visibility requirement, and retry count.
- [ ] Implement cancellation when a chunk is unloaded before worker baking begins.
- [ ] Implement stats for queued, baking, waiting upload, resident, visible, hidden resident, evict pending, disposed, and failed chunks.
- [ ] Do not import `three` in this module.

## Acceptance criteria

- [ ] Every documented lifecycle transition is test-covered.
- [ ] Region load enqueues work and never creates WebGL resources.
- [ ] Region unload cancels queued work or marks resident chunks for eviction.
- [ ] Queue ordering is deterministic for equal priority.
- [ ] Stats can feed E35 diagnostics.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/ChunkBakeQueue.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run render:boundaries`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E34/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

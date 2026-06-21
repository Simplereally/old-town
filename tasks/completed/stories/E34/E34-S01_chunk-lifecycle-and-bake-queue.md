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

- [X] Write failing tests in `apps/client/src/game/renderer/ChunkBakeQueue.test.ts`.
- [X] Create `apps/client/src/game/renderer/ChunkBakeQueue.ts`.
- [X] Export `ChunkLifecycleState`, `ChunkBakeQueue`, `ChunkBakeJob`, `ChunkBakePriority`, and `ChunkBakeQueueStats`.
- [X] Implement states exactly: `unseen`, `metadata_loaded`, `bake_requested`, `baking_worker`, `baked_waiting_gpu_upload`, `gpu_resident`, `visible`, `hidden_resident`, `evict_pending`, and `disposed`.
- [X] Implement `ingestRegionLoad(regionId, chunks)` that creates/updates metadata and queues bake jobs without touching Three.
- [X] Implement `ingestRegionUnload(regionId)` that marks matching chunks `evict_pending` or `disposed` according to residency state.
- [X] Implement job priority from distance to focus tile, visibility requirement, and retry count.
- [X] Implement cancellation when a chunk is unloaded before worker baking begins.
- [X] Implement stats for queued, baking, waiting upload, resident, visible, hidden resident, evict pending, disposed, and failed chunks.
- [X] Do not import `three` in this module.

## Acceptance criteria

- [X] Every documented lifecycle transition is test-covered.
- [X] Region load enqueues work and never creates WebGL resources.
- [X] Region unload cancels queued work or marks resident chunks for eviction.
- [X] Queue ordering is deterministic for equal priority.
- [X] Stats can feed E35 diagnostics.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/ChunkBakeQueue.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run render:boundaries`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E34/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

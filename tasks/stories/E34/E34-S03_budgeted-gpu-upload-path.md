# E34-S03 - Budgeted GPU Upload Path

## Epic

E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E34-S02
- Blocks: E34-S04, E34-S05, E34-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- Three.js BufferAttribute: https://threejs.org/docs/pages/BufferAttribute.html
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Objective

Implement a main-thread GPU upload queue that converts baked chunk buffers into Three resources within a per-frame upload budget.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/ChunkUploadQueue.test.ts`.
- [ ] Create `apps/client/src/game/renderer/ChunkUploadQueue.ts`.
- [ ] Export `ChunkUploadQueue`, `ChunkUploadBudget`, `QueuedChunkUpload`, and `ChunkUploadStats`.
- [ ] Default budget must be max `2ms` app time per frame and max one chunk upload per frame unless explicitly configured.
- [ ] Implement `enqueueBakedChunk(payload)` that marks the lifecycle state `baked_waiting_gpu_upload`.
- [ ] Implement `processFrame(frameStartMs, nowFn)` that uploads until budget is exhausted.
- [ ] Build `BufferGeometry` from transferred typed arrays and set `BufferAttribute.usage` before first render.
- [ ] Create or reuse materials through `RenderResourceRegistry`; do not create duplicate materials per chunk.
- [ ] Group terrain geometry by material layer so a chunk uses one draw path per material layer, not one mesh per tile.
- [ ] Do not upload textures during combat-active frames; expose a `canUploadHeavyResources` flag or callback.
- [ ] Update `TerrainLayer` to display uploaded chunk resources and stop creating one mesh per tile for baked chunks.
- [ ] Preserve debug-grid/collision overlay compatibility.
- [ ] Expose upload queue depth and last upload duration for E35 HUD.

## Acceptance criteria

- [ ] Upload queue processes no more than the configured per-frame budget.
- [ ] Baked chunks become `gpu_resident` only after upload succeeds.
- [ ] Upload failure disposes partial geometry/material references and records failure state.
- [ ] Terrain rendering no longer creates one mesh per tile for baked chunk path.
- [ ] Terrain chunk draw paths are grouped by material layer.
- [ ] Upload queue is driven from render frame/update code, not WebSocket callbacks.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/ChunkUploadQueue.test.ts`
- [ ] `bun run test -- apps/client/src/game/scene/TerrainLayer.test.ts`
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

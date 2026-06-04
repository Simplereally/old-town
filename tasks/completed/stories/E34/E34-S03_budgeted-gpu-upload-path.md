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

- [X] Write failing tests in `apps/client/src/game/renderer/ChunkUploadQueue.test.ts`.
- [X] Create `apps/client/src/game/renderer/ChunkUploadQueue.ts`.
- [X] Export `ChunkUploadQueue`, `ChunkUploadBudget`, `QueuedChunkUpload`, and `ChunkUploadStats`.
- [X] Default budget must be max `2ms` app time per frame and max one chunk upload per frame unless explicitly configured.
- [X] Implement `enqueueBakedChunk(payload)` that marks the lifecycle state `baked_waiting_gpu_upload`.
- [X] Implement `processFrame(frameStartMs, nowFn)` that uploads until budget is exhausted.
- [X] Build `BufferGeometry` from transferred typed arrays and set `BufferAttribute.usage` before first render.
- [X] Create or reuse materials through `RenderResourceRegistry`; do not create duplicate materials per chunk.
- [X] Group terrain geometry by material layer so a chunk uses one draw path per material layer, not one mesh per tile.
- [X] Do not upload textures during combat-active frames; expose a `canUploadHeavyResources` flag or callback.
- [X] Update `TerrainLayer` to display uploaded chunk resources and stop creating one mesh per tile for baked chunks.
- [X] Preserve debug-grid/collision overlay compatibility.
- [X] Expose upload queue depth and last upload duration for E35 HUD.

## Acceptance criteria

- [X] Upload queue processes no more than the configured per-frame budget.
- [X] Baked chunks become `gpu_resident` only after upload succeeds.
- [X] Upload failure disposes partial geometry/material references and records failure state.
- [X] Terrain rendering no longer creates one mesh per tile for baked chunk path.
- [X] Terrain chunk draw paths are grouped by material layer.
- [X] Upload queue is driven from render frame/update code, not WebSocket callbacks.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/ChunkUploadQueue.test.ts`
- [X] `bun run test -- apps/client/src/game/scene/TerrainLayer.test.ts`
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

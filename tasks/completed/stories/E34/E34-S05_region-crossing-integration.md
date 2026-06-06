# E34-S05 - Region Crossing Integration

## Epic

E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E34-S04
- Blocks: E34-S06

## Spec references

- docs/technical/snapshot-interpolation.md
- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §6
- POC_SPEC.md §8.5

## Objective

Integrate region load/unload packet data with the chunk bake/upload/residency pipeline so region crossing is queued, budgeted, and independent of packet-arrival timing.

## Implementation checklist

- [X] Write failing integration tests in `apps/client/src/game/renderer/RegionStreaming.integration.test.ts`.
- [X] Update pure packet ingestion so `regionLoads` call `ChunkBakeQueue.ingestRegionLoad` and `regionUnloads` call `ChunkBakeQueue.ingestRegionUnload`.
- [X] Ensure these calls do not create Three objects or perform GPU upload in the WebSocket callback.
- [X] Drive `ChunkBakeQueue`, `ChunkBakeWorkerClient`, `ChunkUploadQueue`, and `ChunkResidencyManager` from render/update orchestration.
- [X] Prioritize chunks near the local player's authoritative or presentation focus tile.
- [X] Preserve existing `TerrainLayer.loadedChunkCount` semantics or replace it with equivalent diagnostics-backed stats.
- [X] Ensure object/prop instance buckets for a chunk become visible only after both terrain upload and bucket resources are ready.
- [X] Test jittered packet order: region load before entity add, entity add before region upload completion, unload before bake completion, and unload after visible.
- [X] Add debug overlay status for queue depths and chunk states.

## Acceptance criteria

- [X] Region crossing enqueues bake/upload work and never hot-swaps large geometry in packet callbacks.
- [X] Unloaded regions cancel or evict pending chunks correctly at every lifecycle stage.
- [X] Entities in not-yet-visible chunks do not create unmanaged meshes; they wait for resource readiness or render with an explicit placeholder policy.
- [X] Jittered packet-order tests preserve client state consistency.
- [X] Debug overlay shows enough chunk state to diagnose loading stalls.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/RegionStreaming.integration.test.ts`
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

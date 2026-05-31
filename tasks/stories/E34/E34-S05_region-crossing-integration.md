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

- [ ] Write failing integration tests in `apps/client/src/game/renderer/RegionStreaming.integration.test.ts`.
- [ ] Update pure packet ingestion so `regionLoads` call `ChunkBakeQueue.ingestRegionLoad` and `regionUnloads` call `ChunkBakeQueue.ingestRegionUnload`.
- [ ] Ensure these calls do not create Three objects or perform GPU upload in the WebSocket callback.
- [ ] Drive `ChunkBakeQueue`, `ChunkBakeWorkerClient`, `ChunkUploadQueue`, and `ChunkResidencyManager` from render/update orchestration.
- [ ] Prioritize chunks near the local player's authoritative or presentation focus tile.
- [ ] Preserve existing `TerrainLayer.loadedChunkCount` semantics or replace it with equivalent diagnostics-backed stats.
- [ ] Ensure object/prop instance buckets for a chunk become visible only after both terrain upload and bucket resources are ready.
- [ ] Test jittered packet order: region load before entity add, entity add before region upload completion, unload before bake completion, and unload after visible.
- [ ] Add debug overlay status for queue depths and chunk states.

## Acceptance criteria

- [ ] Region crossing enqueues bake/upload work and never hot-swaps large geometry in packet callbacks.
- [ ] Unloaded regions cancel or evict pending chunks correctly at every lifecycle stage.
- [ ] Entities in not-yet-visible chunks do not create unmanaged meshes; they wait for resource readiness or render with an explicit placeholder policy.
- [ ] Jittered packet-order tests preserve client state consistency.
- [ ] Debug overlay shows enough chunk state to diagnose loading stalls.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/RegionStreaming.integration.test.ts`
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

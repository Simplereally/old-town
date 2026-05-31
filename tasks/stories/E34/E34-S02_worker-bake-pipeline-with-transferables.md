# E34-S02 - Worker Bake Pipeline with Transferables

## Epic

E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E34-S01
- Blocks: E34-S03, E34-S04, E34-S05, E34-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- MDN transferable objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- MDN SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer

## Objective

Implement the worker-side terrain/static chunk bake pipeline using transferable `ArrayBuffer`s. Do not introduce `SharedArrayBuffer`.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/ChunkBakeWorkerClient.test.ts`.
- [ ] Create `apps/client/src/game/renderer/ChunkBakeWorkerClient.ts`.
- [ ] Create `apps/client/src/game/renderer/chunk-bake.worker.ts`.
- [ ] Define worker request message: `type: "bake_chunk"`, `jobId`, `regionId`, `chunkCoord`, `tiles`, `objectRefs`, and `requestVersion`.
- [ ] Define worker success message: `type: "bake_chunk_success"`, `jobId`, `regionId`, `chunkCoord`, `payload`, and `transferables`.
- [ ] Define worker failure message: `type: "bake_chunk_failure"`, `jobId`, `regionId`, `chunkCoord`, `errorCode`, and `message`.
- [ ] Define cancellation message: `type: "cancel_bake_chunk"`, `jobId`.
- [ ] Define `BakedChunkPayload` with typed arrays for positions, normals, colors, indices, material groups, bounds, tile metadata, collision debug data, and object instance descriptors.
- [ ] Transfer the underlying `ArrayBuffer`s for baked typed arrays back to the main thread.
- [ ] After transfer, treat worker-side buffers as detached and never read from them.
- [ ] Implement worker pool concurrency with a default of `max(1, min(2, navigator.hardwareConcurrency - 1))` where browser APIs are available, plus deterministic test injection.
- [ ] Add fallback synchronous test builder for Vitest environments that cannot instantiate real module workers.
- [ ] Explicitly assert that no `SharedArrayBuffer` constructor or type is used.

## Acceptance criteria

- [ ] Worker success payloads arrive with transferable `ArrayBuffer`s.
- [ ] Main-thread tests prove transfer list contains the baked buffers.
- [ ] Worker failures mark jobs failed without corrupting queue state.
- [ ] Cancellation prevents obsolete chunks from reaching upload.
- [ ] No `SharedArrayBuffer` usage is introduced.
- [ ] The worker module contains no Three imports; it bakes plain arrays only.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/ChunkBakeWorkerClient.test.ts`
- [ ] `test -z "$(rg "SharedArrayBuffer" apps/client/src/game/renderer -n || true)"`
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

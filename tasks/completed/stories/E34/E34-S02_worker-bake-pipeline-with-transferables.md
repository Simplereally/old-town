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

- [X] Write failing tests in `apps/client/src/game/renderer/ChunkBakeWorkerClient.test.ts`.
- [X] Create `apps/client/src/game/renderer/ChunkBakeWorkerClient.ts`.
- [X] Create `apps/client/src/game/renderer/chunk-bake.worker.ts`.
- [X] Define worker request message: `type: "bake_chunk"`, `jobId`, `regionId`, `chunkCoord`, `tiles`, `objectRefs`, and `requestVersion`.
- [X] Define worker success message: `type: "bake_chunk_success"`, `jobId`, `regionId`, `chunkCoord`, `payload`, and `transferables`.
- [X] Define worker failure message: `type: "bake_chunk_failure"`, `jobId`, `regionId`, `chunkCoord`, `errorCode`, and `message`.
- [X] Define cancellation message: `type: "cancel_bake_chunk"`, `jobId`.
- [X] Define `BakedChunkPayload` with typed arrays for positions, normals, colors, indices, material groups, bounds, tile metadata, collision debug data, and object instance descriptors.
- [X] Transfer the underlying `ArrayBuffer`s for baked typed arrays back to the main thread.
- [X] After transfer, treat worker-side buffers as detached and never read from them.
- [X] Implement worker pool concurrency with a default of `max(1, min(2, navigator.hardwareConcurrency - 1))` where browser APIs are available, plus deterministic test injection.
- [X] Add fallback synchronous test builder for Vitest environments that cannot instantiate real module workers.
- [X] Explicitly assert that no `SharedArrayBuffer` constructor or type is used.

## Acceptance criteria

- [X] Worker success payloads arrive with transferable `ArrayBuffer`s.
- [X] Main-thread tests prove transfer list contains the baked buffers.
- [X] Worker failures mark jobs failed without corrupting queue state.
- [X] Cancellation prevents obsolete chunks from reaching upload.
- [X] No `SharedArrayBuffer` usage is introduced.
- [X] The worker module contains no Three imports; it bakes plain arrays only.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/ChunkBakeWorkerClient.test.ts`
- [X] `test -z "$(rg "SharedArrayBuffer" apps/client/src/game/renderer -n || true)"`
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

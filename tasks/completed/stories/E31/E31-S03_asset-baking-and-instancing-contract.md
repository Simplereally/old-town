# E31-S03 - Asset Baking and Instancing Contract

## Epic

E31 - Render Architecture Contracts

## Dependency chain

- Depends on: E31-S02
- Blocks: E31-S04, E33, E34

## Spec references

- ENGINE_AND_RENDERING.md
- docs/technical/render-ecs-architecture.md
- POC_SPEC.md §6
- POC_SPEC.md §7.3
- POC_SPEC.md §23
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js BufferAttribute: https://threejs.org/docs/pages/BufferAttribute.html
- MDN transferable objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- MDN SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Objective

Create `docs/technical/asset-baking-and-instancing.md`, the exact contract for render resources, instanced buckets, object pools, worker-baked chunks, transferable buffers, and chunk residency.

## Required architectural decisions

- Terrain chunk mesh baking runs outside the packet callback path.
- Worker output uses transferable `ArrayBuffer`s in Phase 1.
- `SharedArrayBuffer` is Phase 2 only after cross-origin isolation is solved and E35 proves `postMessage` transfer is the bottleneck.
- OffscreenCanvas renderer movement is Phase 3 only after main-thread UI contention is proven.
- Repeated static props and ground items use instancing or atlas-backed billboards, not one mesh per object.
- `InstanceBucketKey` is exactly `archetypeId + materialId + regionId + layer`.
- Runtime code batches instance updates and sets `needsUpdate` once per bucket flush.
- Runtime code sets `BufferAttribute.usage` before first render and uses update ranges when they provide a measurable benefit.
- The default low-poly material path remains `MeshLambertMaterial`, `MeshToonMaterial`, or registry-owned built-in Three materials; custom `ShaderMaterial({ lights: true })` is not allowed for default gameplay geometry.

## Implementation checklist

- [X] Create `docs/technical/asset-baking-and-instancing.md`.
- [X] Add an "Asset Classes" table covering terrain chunks, static props, ground items, actors/NPCs, hitsplats/projectiles, far decorations, and UI overlays.
- [X] Define `RenderResourceKey` with `type`, `contentId`, `variant`, and `materialId`.
- [X] Define `InstanceBucketKey` exactly as `archetypeId`, `materialId`, `regionId`, and `layer`.
- [X] Define `InstanceBucket` required state: `mesh`, `capacity`, `activeCount`, `freeList`, `entityIdToSlot`, `slotToEntityId`, `instanceMatrixArray`, optional `instanceColorOrSeedArray`, `dirtyStart`, `dirtyEnd`, `boundsDirty`, and `lastFlushFrame`.
- [X] Define `InstanceBucket` operations: `acquire`, `release`, `writeTransform`, `writeColorOrSeed`, `markDirty`, `flush`, `recomputeBoundsIfNeeded`, and `dispose`.
- [X] Define that `mesh.count` equals `activeCount` after compaction or slot reuse policy is applied.
- [X] Define whether buckets use slot compaction or free-list holes; choose one policy for E33 and document it. The required policy is free-list holes with `mesh.count` equal to highest active slot plus one, plus periodic compaction only during non-combat idle frames.
- [X] Define `RenderObjectPool<T>` operations: `prewarm`, `acquire`, `release`, `reset`, `dispose`, and `activeCount`.
- [X] Define `ChunkBakeQueue` states exactly: `unseen`, `metadata_loaded`, `bake_requested`, `baking_worker`, `baked_waiting_gpu_upload`, `gpu_resident`, `visible`, `hidden_resident`, `evict_pending`, and `disposed`.
- [X] Define worker message types for bake request, bake success, bake failure, and cancellation.
- [X] Define baked chunk payload fields: positions, normals, colors, indices, material groups, bounds, tile metadata, collision debug overlay data, and transferable buffer list.
- [X] Define main-thread GPU upload budget defaults: max 2ms per frame for POC, max one chunk upload per frame unless measured frame time is below budget.
- [X] Define that no texture upload, material creation, shader compilation, or huge geometry allocation may happen during combat if it can be queued earlier.
- [X] Define material standards: default gameplay geometry uses built-in Three materials or `onBeforeCompile` customization; full custom shader libraries require a future ADR and E35 evidence.
- [X] Update `docs/00-index.md` with a link to `docs/technical/asset-baking-and-instancing.md`.

## Acceptance criteria

- [X] `docs/technical/asset-baking-and-instancing.md` exists and contains all required data shapes, state machines, operations, and defaults.
- [X] The document explicitly requires transferables before `SharedArrayBuffer`.
- [X] The document explicitly defers OffscreenCanvas renderer movement and WebGPU.
- [X] The document defines exact bucket key, bucket state, dirty update, bounds, and disposal semantics.
- [X] The document defines exact chunk lifecycle states and worker message shapes.
- [X] The document rejects custom shader materials as the default gameplay geometry path.
- [X] `docs/00-index.md` links to the new document.

## Validation commands

- [X] `bun run lint`
- [X] `bun run typecheck`
- [X] `bun run tasks:status`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E31/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

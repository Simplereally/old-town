# E33-S02 - Instance Bucket Core

## Epic

E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E33-S01
- Blocks: E33-S03, E33-S04, E33-S05, E33-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js BufferAttribute: https://threejs.org/docs/pages/BufferAttribute.html

## Objective

Implement `InstanceBucket`, the core render primitive for repeated objects that share geometry/material and differ by transform/color/seed.

## Implementation checklist

- [X] Write failing tests in `apps/client/src/game/renderer/InstanceBucket.test.ts`.
- [X] Create `apps/client/src/game/renderer/InstanceBucket.ts`.
- [X] Export `InstanceBucketKey`, `InstanceBucket`, `InstanceBucketOptions`, `InstanceSlot`, and `InstanceBucketStats`.
- [X] Construct buckets with `InstancedMesh` from registry-owned geometry/material and a fixed initial capacity.
- [X] Set `instanceMatrix.usage` before first render according to documented dynamic usage.
- [X] Implement `acquire(entityId)` with `entityIdToSlot`, `slotToEntityId`, and a free-list hole policy.
- [X] Implement `release(entityId)` that clears the slot mapping, hides or zero-scales the slot, marks the dirty range, and updates active count.
- [X] Implement `writeTransform(entityId, matrixOrComponents)` without allocating scratch objects per call.
- [X] Implement optional color/seed writes through `instanceColor` or a custom instanced attribute when configured.
- [X] Track `dirtyStart`, `dirtyEnd`, `boundsDirty`, and `lastFlushFrame`.
- [X] Implement `flush(frameId)` that adds one update range where supported, sets `needsUpdate` once, updates `mesh.count`, recomputes bounds only when needed, and clears dirty state.
- [X] Implement deterministic capacity growth outside per-frame hot loops or require prewarming before use.
- [X] Implement `dispose()` and stats.

## Acceptance criteria

- [X] `needsUpdate` is set at most once per attribute per bucket flush.
- [X] `mesh.count` matches the highest active slot plus one under the chosen free-list hole policy.
- [X] Releasing and reacquiring slots preserves correct entity-to-slot mappings.
- [X] Bounds recomputation is triggered after bulk placement or any dirty range that can affect culling/raycasting.
- [X] Tests prove no per-instance flush happens inside a batch update.
- [X] The bucket is render-only and is not imported by net/store/server/shared modules.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/InstanceBucket.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

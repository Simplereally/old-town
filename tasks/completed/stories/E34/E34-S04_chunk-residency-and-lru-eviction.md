# E34-S04 - Chunk Residency and LRU Eviction

## Epic

E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E34-S03
- Blocks: E34-S05, E34-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- POC_SPEC.md §6.1
- POC_SPEC.md §6.2

## Objective

Implement deterministic chunk visibility, hidden-resident retention, LRU eviction, and memory-pressure disposal for baked terrain and associated instance buckets.

## Implementation checklist

- [X] Write failing tests in `apps/client/src/game/renderer/ChunkResidencyManager.test.ts`.
- [X] Create `apps/client/src/game/renderer/ChunkResidencyManager.ts`.
- [X] Export `ChunkResidencyManager`, `ChunkResidencyOptions`, `ChunkResidencyStats`, and `ChunkVisibilityDecision`.
- [X] Track focus tile/region, chunk distance, last visible frame, last accessed frame, approximate GPU bytes, and lifecycle state.
- [X] Implement `setFocusTile(tile)` and deterministic visibility decisions for active scene radius.
- [X] Move chunks from `gpu_resident` to `visible` when inside visible radius.
- [X] Move chunks from `visible` to `hidden_resident` when outside visible radius but inside resident radius.
- [X] Move chunks from `hidden_resident` to `evict_pending` by LRU order when memory budget or resident radius is exceeded.
- [X] Dispose geometry/material references and release object/prop instance buckets when transitioning to `disposed`.
- [X] Keep metadata for disposed chunks so they can be re-baked if re-entered.
- [X] Expose stats for visible chunks, hidden resident chunks, evict pending chunks, disposed chunks, and approximate GPU bytes.

## Acceptance criteria

- [X] Visibility state transitions are deterministic from focus tile and frame id.
- [X] LRU eviction chooses the farthest/oldest hidden-resident chunks first according to documented tie-breakers.
- [X] Disposed chunks release geometry and bucket resources exactly once.
- [X] Re-entering a disposed chunk queues a new bake instead of resurrecting disposed resources.
- [X] Stats can feed E35 diagnostics.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/ChunkResidencyManager.test.ts`
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

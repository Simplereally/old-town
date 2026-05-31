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

- [ ] Write failing tests in `apps/client/src/game/renderer/ChunkResidencyManager.test.ts`.
- [ ] Create `apps/client/src/game/renderer/ChunkResidencyManager.ts`.
- [ ] Export `ChunkResidencyManager`, `ChunkResidencyOptions`, `ChunkResidencyStats`, and `ChunkVisibilityDecision`.
- [ ] Track focus tile/region, chunk distance, last visible frame, last accessed frame, approximate GPU bytes, and lifecycle state.
- [ ] Implement `setFocusTile(tile)` and deterministic visibility decisions for active scene radius.
- [ ] Move chunks from `gpu_resident` to `visible` when inside visible radius.
- [ ] Move chunks from `visible` to `hidden_resident` when outside visible radius but inside resident radius.
- [ ] Move chunks from `hidden_resident` to `evict_pending` by LRU order when memory budget or resident radius is exceeded.
- [ ] Dispose geometry/material references and release object/prop instance buckets when transitioning to `disposed`.
- [ ] Keep metadata for disposed chunks so they can be re-baked if re-entered.
- [ ] Expose stats for visible chunks, hidden resident chunks, evict pending chunks, disposed chunks, and approximate GPU bytes.

## Acceptance criteria

- [ ] Visibility state transitions are deterministic from focus tile and frame id.
- [ ] LRU eviction chooses the farthest/oldest hidden-resident chunks first according to documented tie-breakers.
- [ ] Disposed chunks release geometry and bucket resources exactly once.
- [ ] Re-entering a disposed chunk queues a new bake instead of resurrecting disposed resources.
- [ ] Stats can feed E35 diagnostics.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/ChunkResidencyManager.test.ts`
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

# E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E33
- Unlocks: E35

## Spec references

- ENGINE_AND_RENDERING.md (Phase C)
- tasks/ENGINE_AND_RENDERING_TASK_GRAPH.md
- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- POC_SPEC.md §6
- POC_SPEC.md §7.3
- POC_SPEC.md §8.5
- POC_SPEC.md §23
- MDN transferable objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- MDN SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Epic goal

Move terrain/static-scene preparation into an asynchronous chunk lifecycle with worker baking, transferable buffers, main-thread GPU upload budgets, and LRU residency. Region load packets must enqueue work instead of hot-swapping large geometry immediately.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E34/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E34-S01` - [Chunk Lifecycle and Bake Queue](../stories/E34/E34-S01_chunk-lifecycle-and-bake-queue.md)
- [X] `E34-S02` - [Worker Bake Pipeline with Transferables](../stories/E34/E34-S02_worker-bake-pipeline-with-transferables.md)
- [X] `E34-S03` - [Budgeted GPU Upload Path](../stories/E34/E34-S03_budgeted-gpu-upload-path.md)
- [X] `E34-S04` - [Chunk Residency and LRU Eviction](../stories/E34/E34-S04_chunk-residency-and-lru-eviction.md)
- [X] `E34-S05` - [Region Crossing Integration](../stories/E34/E34-S05_region-crossing-integration.md)
- [X] `E34-S06` - [Asset Failure and Context Recovery](../stories/E34/E34-S06_asset-failure-and-context-recovery.md)

## Epic acceptance criteria

- [X] Every region/chunk render payload moves through the documented state machine from `unseen` to `disposed`.
- [X] Worker messages use transferable `ArrayBuffer`s for baked geometry payloads; no `SharedArrayBuffer` dependency is introduced.
- [X] GPU buffer/texture uploads are limited by a per-frame budget and never happen inside packet callbacks.
- [X] Chunk visibility, hidden-resident state, eviction, and disposal are deterministic and test-covered.
- [X] Region crossing remains smooth under jittered packet delivery and background bake completion order.
- [X] Failure paths dispose partial resources and expose debug status without corrupting authoritative client state.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

# E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E32, E33, E34
- Unlocks: (none - final engine/rendering epic)

## Spec references

- ENGINE_AND_RENDERING.md (Phase D and Phase E guardrails)
- tasks/ENGINE_AND_RENDERING_TASK_GRAPH.md
- docs/technical/performance-budgets.md
- POC_SPEC.md §27
- POC_SPEC.md §28.1
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN EXT_disjoint_timer_query: https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query

## Epic goal

Make the renderer measurable. Add debug HUD metrics, deterministic stress harnesses, allocation/draw-call budgets, and explicit gates that prevent future `SharedArrayBuffer`, OffscreenCanvas, or WebGPU work from starting without evidence.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E35/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E35-S01` - [Renderer Metrics HUD and Budget Constants](stories/E35/E35-S01_renderer-metrics-hud-and-budget-constants.md)
- [ ] `E35-S02` - [Snapshot Jitter Stress Harness](stories/E35/E35-S02_snapshot-jitter-stress-harness.md)
- [ ] `E35-S03` - [Region Crossing Stress Harness](stories/E35/E35-S03_region-crossing-stress-harness.md)
- [ ] `E35-S04` - [Entity Scale Stress Harness](stories/E35/E35-S04_entity-scale-stress-harness.md)
- [ ] `E35-S05` - [Instanced Prop Scale Stress Harness](stories/E35/E35-S05_instanced-prop-scale-stress-harness.md)
- [ ] `E35-S06` - [Heap and Draw-Call Gate](stories/E35/E35-S06_heap-and-draw-call-gate.md)

## Epic acceptance criteria

- [ ] Renderer metrics include frame p95/p99, draw calls, geometries, textures, visible actors, visible objects, loaded chunks, snapshot buffer depth, upload queue depth, and optional GPU timings.
- [ ] Stress harnesses cover jittered 600ms snapshots, region crossing, 1k render-cached entities, and at least 10k instanced props.
- [ ] Budget gates are deterministic enough for CI where possible and explicitly marked manual/browser-only where CI cannot provide WebGL metrics.
- [ ] `SharedArrayBuffer`, OffscreenCanvas renderer movement, and WebGPU are documented as blocked future work unless E35 metrics prove the current architecture is insufficient.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

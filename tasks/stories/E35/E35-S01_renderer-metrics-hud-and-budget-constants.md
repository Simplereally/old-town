# E35-S01 - Renderer Metrics HUD and Budget Constants

## Epic

E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E34-S06
- Blocks: E35-S02, E35-S03, E35-S04, E35-S05, E35-S06

## Spec references

- docs/technical/performance-budgets.md
- POC_SPEC.md §28.1
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN EXT_disjoint_timer_query: https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query

## Objective

Implement renderer budget constants, rolling metrics, and a debug HUD that makes snapshot/render/resource behavior measurable during development.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/RendererMetrics.test.ts`.
- [ ] Create `apps/client/src/game/renderer/RendererBudgets.ts`.
- [ ] Create `apps/client/src/game/renderer/RendererMetrics.ts`.
- [ ] Define budget constants from `docs/technical/performance-budgets.md`: frame p95, frame p99, draw-call targets, upload budget, entity stress targets, prop stress targets, snapshot ingest target, and heap-flat target.
- [ ] Implement rolling p50/p95/p99 frame-time calculation over a fixed sample window without allocating per frame.
- [ ] Collect draw calls, geometries, textures, actors, objects, loaded chunks, snapshot buffer depth, upload queue depth, worker queue depth, and chunk lifecycle counts.
- [ ] Add optional GPU timing adapter using `EXT_disjoint_timer_query` when available and no-op metrics when unavailable.
- [ ] Update debug overlay to display metrics at a throttled frequency no faster than 4 times per second.
- [ ] Ensure production gameplay does not call blocking WebGL APIs for metrics in active frames.
- [ ] Add metric labels and threshold status for E35 stress gates.

## Acceptance criteria

- [ ] Debug HUD shows frame p95/p99, draw calls, geometries, textures, actor/object counts, chunk counts, snapshot buffer depth, upload queue depth, and worker queue depth.
- [ ] Metrics update without per-frame string/array allocation in hot loops; formatting happens only on throttled HUD update.
- [ ] GPU timing is optional and unavailable extension state is handled cleanly.
- [ ] Budget constants are exported for stress tests.
- [ ] Existing debug overlay fields are preserved or intentionally replaced by richer equivalents.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/RendererMetrics.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run render:boundaries`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E31-S04 - Performance Budgets and Diagnostics Contract

## Epic

E31 - Render Architecture Contracts

## Dependency chain

- Depends on: E31-S03
- Blocks: E32, E33, E34, E35

## Spec references

- ENGINE_AND_RENDERING.md
- docs/technical/render-ecs-architecture.md
- docs/technical/snapshot-interpolation.md
- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §27
- POC_SPEC.md §28.1
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN EXT_disjoint_timer_query: https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query

## Objective

Create `docs/technical/performance-budgets.md`, the exact performance, diagnostics, stress, and advanced-backend gating contract for E32-E35.

## Required architectural decisions

- The target is zero app-level allocations in hot loops and flat heap under stress, not literal browser-wide `0 B/s`.
- WebGL GPU timing is optional because `EXT_disjoint_timer_query` is not universally available.
- Production gameplay must not call blocking WebGL APIs such as `getError`, `getParameter`, or CPU `readPixels` in active frames.
- Stress tests should use deterministic fake data wherever possible and browser/manual gates where WebGL metrics cannot be made stable in CI.
- Future `SharedArrayBuffer`, OffscreenCanvas renderer movement, or WebGPU work requires a documented E35 metric failure and a new ADR.

## Implementation checklist

- [ ] Create `docs/technical/performance-budgets.md`.
- [ ] Add a "Budget Table" with exact POC targets: frame p95 `<16.6ms`, frame p99 `<33ms`, visible town draw calls `<150`, optimized draw calls `<75`, chunk GPU upload budget `<2ms/frame`, snapshot ingest `<1ms`, visible entities `200`, render-cached stress entities `1000`, visible instanced props `5000+`, stress instanced props `30000+`, and heap flat after 10 minutes idle.
- [ ] Add a "Hot Loop Allocation Standard" naming the exact loops and systems where new object/array/function allocation is forbidden.
- [ ] Add a "Required Metrics" section naming frame time, draw calls, geometries, textures, actors, objects, loaded chunks, snapshot buffer depth, upload queue depth, worker queue depth, heap sample, and optional GPU time.
- [ ] Add a "Renderer HUD" section specifying debug overlay labels and update frequency.
- [ ] Add a "Stress Harnesses" section specifying jitter snapshots, region crossing, 1k entities, 10k instanced props, 30k optional/manual props, and 5 minute heap simulation.
- [ ] Add a "WebGL Production Restrictions" section banning runtime material churn, per-frame shader compilation, texture upload during combat unless explicitly queued, and blocking readback APIs in active gameplay.
- [ ] Add an "Advanced Backend Gate" section requiring a future ADR and metric evidence before `SharedArrayBuffer`, OffscreenCanvas renderer movement, or WebGPU tasks are opened.
- [ ] Update `docs/00-index.md` with a link to `docs/technical/performance-budgets.md`.

## Acceptance criteria

- [ ] `docs/technical/performance-budgets.md` exists and contains all budgets, metrics, hot-loop rules, stress harness definitions, and backend gates above.
- [ ] The document distinguishes CI-enforceable gates from manual/browser-only gates.
- [ ] The document explicitly states that optional GPU timing must gracefully no-op when `EXT_disjoint_timer_query` is unavailable.
- [ ] The document blocks `SharedArrayBuffer`, OffscreenCanvas renderer movement, and WebGPU without E35 evidence and a future ADR.
- [ ] `docs/00-index.md` links to the new document.

## Validation commands

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run tasks:status`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E31/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

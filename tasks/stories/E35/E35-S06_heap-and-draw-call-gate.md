# E35-S06 - Heap and Draw-Call Gate

## Epic

E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E35-S05
- Blocks: (none)

## Spec references

- docs/technical/performance-budgets.md
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN EXT_disjoint_timer_query: https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query

## Objective

Add final budget gates for heap behavior, draw calls, upload queue behavior, and advanced-backend deferral evidence.

## Implementation checklist

- [ ] Create `scripts/render-stress-report.ts`.
- [ ] Add package scripts `stress:render` and `stress:render:ci`; `stress:render:ci` must run every CI-safe stress file added in E35 and must exit non-zero on any failed gate.
- [ ] Aggregate metrics from E35-S02 through E35-S05 into one report shape with pass/fail status.
- [ ] Gate CI-friendly budgets: snapshot ingest `<1ms` under deterministic burst, no stale packet mutation, 10k prop bucket flush semantics, no unbounded pool growth, and no packet-callback render mutation.
- [ ] Add manual/browser-only gates for frame p95/p99, draw calls, GPU timing, and 5 or 10 minute heap stability when those metrics require a real browser WebGL context.
- [ ] Add a heap sampling helper that uses browser APIs only when available and no-ops with an explicit unavailable status elsewhere.
- [ ] Add draw-call budget assertions from `renderer.info.render.calls` for browser/manual harness routes.
- [ ] Add a section to `docs/technical/performance-budgets.md` recording the exact command(s) to run and how to read pass/fail statuses.
- [ ] Add an "Advanced Backend Evidence Gate" check: report must state `SharedArrayBuffer`, OffscreenCanvas renderer movement, and WebGPU remain blocked unless a metric fails, a current-browser reproduction is attached, and a future ADR is opened.

## Acceptance criteria

- [ ] `bun run stress:render:ci` or the documented Vitest equivalent runs all CI-safe stress gates.
- [ ] The report clearly separates passed, failed, skipped-unavailable, and manual-required metrics.
- [ ] Heap and draw-call gates do not pretend unavailable browser APIs were measured.
- [ ] Advanced backend work remains blocked unless the report contains failing evidence and a future ADR path.
- [ ] All E35 stress harnesses are discoverable from documentation.

## Validation commands

- [ ] `bun run stress:render:ci`
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

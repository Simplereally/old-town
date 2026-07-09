# E50 — Test Suite Performance and Quality Gates

## Dependency chain

- Depends on: nothing (can run any time; independent of E45–E47 content work)
- Unlocks: faster iteration for every subsequent epic

## Spec references

- `AGENTS.md` — Validation discipline section (this epic strengthens it)
- Root `package.json` scripts: `test`, `test:postgres`, `typecheck`, `check`, `content:validate`, `render:boundaries`, `stress:render:ci`
- Vitest docs: projects/workspace config, `pool: "threads"`, `isolate`, fake timers

## Epic goal

The test suite is the bottleneck for every agent working this repo (evidenced by the standing `fix/test-suite-perf` effort). This epic makes `bun run test` fast and deterministic, splits slow integration/render suites into an explicit second lane, and adds a CI pipeline so the quality gates in `AGENTS.md` are enforced mechanically instead of by convention. Codebase-health epic: no gameplay changes.

## Approach summary

1. **Measure first.** Produce a per-file duration report and commit a baseline. All later stories must show numbers against it. No optimization without a measurement.
2. **Determinism.** The engine's 600 ms tick invariant means gameplay tests should never wall-clock sleep. Any test using real timers, real WebSocket connections, or real `setTimeout` for tick progression gets converted to manual tick advancement / fake timers / in-memory transports.
3. **Two lanes.** Lane 1 (default `bun run test`): fast unit + logic tests, target < 60 s locally. Lane 2 (`bun run test:heavy`): integration (multiplayer loop, websocket transport, stress/perf, render-heavy Three.js suites). CI runs both; humans and agents iterate on lane 1.
4. **CI.** A GitHub Actions workflow running: `bun install` → `typecheck` → `biome check` → lane 1 tests → `content:validate` → `render:boundaries` → lane 2 tests → (optional, service-container) `test:postgres`.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Move completed story files into `tasks/completed/stories/E50/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E50-S01` — [Test-suite profiling and committed baseline](../stories/E50/E50-S01_test-suite-profiling-and-committed-baseline.md)
- [X] `E50-S02` — [Deterministic tests: kill real timers and real sockets](../stories/E50/E50-S02_deterministic-tests-kill-real-timers-and-real-sockets.md)
- [X] `E50-S03` — [Two-lane vitest projects split](../stories/E50/E50-S03_two-lane-vitest-projects-split.md)
- [X] `E50-S04` — [CI pipeline and enforced quality gates](../stories/E50/E50-S04_ci-pipeline-and-enforced-quality-gates.md)

## Epic acceptance criteria

- [X] `bun run test` (fast lane) completes in under 60 seconds on a developer laptop and contains zero real sleeps > 50 ms.
- [X] Heavy suites run green in their own lane; nothing was deleted to get fast — only moved or made deterministic.
- [X] CI enforces typecheck, lint/format, both test lanes, content validation, and render boundaries on every PR.
- [X] A committed doc records before/after per-file timings.

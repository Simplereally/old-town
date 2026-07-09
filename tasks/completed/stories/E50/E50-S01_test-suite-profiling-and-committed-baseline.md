# E50-S01 — Test-suite profiling and committed baseline

## Epic

E50 — Test Suite Performance and Quality Gates

## Dependency chain

- Depends on: none
- Blocks: E50-S02

## Objective

Measure where test time actually goes and commit the numbers, so every later change is judged against data instead of vibes.

## Required work

- [X] Run the full suite with per-file timing: `bun run test -- --reporter=verbose` and also machine-readable: `vitest run --reporter=json --outputFile=/tmp/vitest-report.json` (invoke via `bunx vitest` or the workspace's vitest binary — match how `package.json` resolves it).
- [X] Write a small one-off script (put it in `scripts/report-test-timings.ts`, keep it — it will be reused in later stories) that parses the JSON reporter output and prints a table sorted by file duration: file, duration ms, test count, and duration/test. Include total wall time and total CPU-summed time.
- [X] Identify and classify the top 20 slowest files into buckets:
  - **A: real-time waits** — tests that `await sleep`, use real `setTimeout`, or wait on real timers/tick loops (grep candidates: `rg -n "setTimeout|sleep\(|await new Promise.*resolve.*,\s*\d" apps --glob '*.test.ts'`).
  - **B: real I/O** — real WebSocket servers/ports, real filesystem, real postgres (note `apps/server/src/net/multiplayer-loop.integration.test.ts`, `websocket-transport.test.ts`, `dev-session.test.ts` as likely members).
  - **C: heavy compute** — Three.js scene construction, stress/perf suites (`TerrainLayer.e42s05-perf.test.ts`, `ActorRenderer.pooling.test.ts`, `lowpoly.test.ts` candidates).
  - **D: legitimately fast-but-many** — leave alone.
- [X] Commit `docs/testing/test-perf-baseline.md` containing: date, machine note, total wall time, the top-20 table with bucket labels, and the target end-state (fast lane < 60 s). This file is the scoreboard for E50-S02/S03.
- [X] Do **not** change any test in this story.

## Acceptance criteria

- [X] `scripts/report-test-timings.ts` exists and runs against a vitest JSON report.
- [X] `docs/testing/test-perf-baseline.md` committed with the classified top-20 table.

## Validation commands

- `bun run test` (must still pass, untouched)
- `bun run typecheck`
- `bun run lint`

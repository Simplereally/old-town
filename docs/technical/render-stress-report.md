# Render Stress Report

> **Authority:** This document describes the output format of the E35 render stress report and how to interpret each section. It is the companion to `performance-budgets.md`.

## 1. How to Run the Report

```bash
# Full report (CI-enforceable + manual gates)
bun scripts/render-stress-report.ts

# CI-only report (excludes manual gates, exits non-zero on failure)
bun scripts/render-stress-report.ts --ci
```

The report executes the following steps internally:

1. Runs `vitest run` on `apps/client/src/game/renderer/stress` with `--reporter=json`.
2. Parses the JSON result into gates grouped by test file and top-level `describe` block.
3. Derives a target string and an actual result string for each gate.
4. Prints a summary, two gate tables, and a final result line.

## 2. Output Format

### 2.1 Header

```
=== E35 Render Stress Report ===

Total suites: 5 | Total tests: 47 | Passed: 47 | Failed: 0 | Pending: 0
```

- **Total suites:** Number of vitest test files executed.
- **Total tests:** Number of individual assertions.
- **Passed / Failed / Pending:** Exact counts from the vitest JSON reporter.

### 2.2 CI-Enforceable Section

```
CI-enforceable
────────────────────────────────────────────────────────────
Gate : region-crossing › RegionCrossingHarness
Target: Cross ≥4 region boundaries, revisit evicted region, visible pipeline, lifecycle transitions, re-enter recovery, diagnostics, upload exhaustion, out-of-order completions
Actual: 7/7 passed
Status: PASSED

Gate : snapshot-jitter › SnapshotJitterHarness
Target: Deterministic path ≥120 ticks, deterministic seeded schedule, no WebGL required
Actual: 3/3 passed
Status: PASSED
```

Each gate contains:

| Field | Meaning |
|-------|---------|
| **Gate** | `fileName › describeTitle` — the file and the top-level describe block. |
| **Target** | The human-readable contract the gate is testing. |
| **Actual** | The result measured by the harness (e.g., `7/7 passed`, `4/4 passed`). `—` means the gate was manual and has no automated actual. |
| **Status** | One of `PASSED`, `FAILED`, `SKIPPED`, or `MANUAL`. |

### 2.3 Manual / Browser-Only Section

```
Manual / browser-only
────────────────────────────────────────────────────────────
Gate : entity-scale › Actor pools (conditional on WebGL)
Target: MeshPool / InstanceBucket draw-call validation with live WebGL context
Actual: —
Status: MANUAL

Gate : entity-scale › Manual browser 1k actor rendering
Target: Visual performance >30 FPS with p95 frame time <16.6ms in browser
Actual: —
Status: MANUAL
```

These gates are excluded from CI enforcement. They exist so reviewers can verify the target manually in a real browser before approving a renderer PR.

### 2.4 Result Line

```
============================================================
RESULT: PASS — all CI-enforceable gates passed.
```

Possible results:

| Result | Meaning |
|--------|---------|
| `PASS` | Every CI-enforceable gate has `status: passed`. |
| `FAIL` | At least one CI-enforceable gate has `status: failed`. The script exits non-zero. |
| `SKIP` | At least one CI-enforceable gate has `status: skipped`. This is a soft warning; the script does not exit non-zero, but the reviewer should check why the gate was unavailable. |

## 3. How to Interpret Each Gate

### 3.1 Region Crossing Gate

- **File:** `region-crossing.stress.test.ts`
- **Harness:** `RegionCrossingHarness`
- **What it tests:** The chunk residency, bake queue, and upload queue lifecycle under rapid region boundary crossings with jitter, out-of-order worker completions, and upload budget exhaustion.
- **Pass criteria:** All seven assertions pass:
  1. The path crosses at least four region boundaries and revisits an evicted region.
  2. Visible chunks reach the visible state without packet-callback upload.
  3. Unloaded chunks cancel queued work, evict resident resources, or dispose resources.
  4. Re-entered disposed chunks are requeued for bake and upload.
  5. Diagnostics expose queue depth and lifecycle counts throughout the run.
  6. Upload budget exhaustion is simulated for multiple consecutive frames.
  7. Out-of-order worker bake completions are handled correctly.

### 3.2 Snapshot Jitter Gate

- **File:** `snapshot-jitter.stress.test.ts`
- **Harness:** `SnapshotJitterHarness`
- **What it tests:** Snapshot interpolation under network jitter, duplicates, drops, and reordering.
- **Pass criteria:** All seven assertions pass:
  1. The harness generates a deterministic path over at least 120 ticks.
  2. The seeded schedule is deterministic across runs.
  3. No real WebGL context is required.
  4. No stale packet mutates the accepted state.
  5. The presentation mode distribution includes normal interpolation and expected hold/freeze/snap modes.
  6. Render positions never exceed the configured snap threshold without producing `mode: 'snap'`.
  7. Local authoritative ticks are not invented between packet arrivals.

### 3.3 Entity Scale Gate

- **File:** `entity-scale.stress.test.ts`
- **Harness:** `EntityScaleHarness`
- **What it tests:** RenderTransformCache capacity growth, hot-loop allocation, and frame metrics under 1,000 deterministic entities.
- **Pass criteria:** The automated assertions pass for:
  1. `EntityScaleHarness` — 1,000 entities, stable IDs, mixed kinds, deterministic paths, fake RAF.
  2. `RenderTransformCache capacity growth` — mapping past initial size, no stale entities after growth and removals.
  3. `forEachPresentation hot loop` — no per-entity allocation, no new presentation objects in the hot loop.
  4. `Frame metrics` — entity count and transform duration recorded across frames, max capacity growth tracked.
- **Manual sub-gates:**
  - `Actor pools (conditional on WebGL)` — requires a live WebGL context to validate MeshPool / InstanceBucket draw calls.
  - `Manual browser 1k actor rendering` — requires a real browser with `window.__DEBUG_RENDER_1K_ACTORS = true` and visual inspection of the FPS overlay.

### 3.4 Instanced Prop Gate

- **File:** `instanced-props.stress.test.ts`
- **Harness:** `InstancedPropHarness`
- **What it tests:** InstanceBucket at scale (10,000 and 30,000 props) without a real WebGL context.
- **Pass criteria:** All eleven assertions pass:
  1. Bucket count equals the unique keys used by spawned props.
  2. `needsUpdate` is set at most once per frame per dirty bucket.
  3. Update ranges and dirty flags follow the `InstanceBucket` policy.
  4. `boundsDirty` is set and cleared according to policy.
  5. Stats report correct visible props, active slots, bucket count, dirty bucket count, and flush duration.
  6. Transform update is exercised on all active props.
  7. Color update is exercised on all active props.
  8. Release and re-acquire cycle works correctly.
  9. Mixed dirty and clean buckets flush correctly.
  10. Deterministic generation with the same seed produces identical props.
  11. The 30,000 prop stress scenario handles the load without error.

### 3.5 Heap Gate

- **File:** `heap-gate.stress.test.ts`
- **What it tests:** Memory and draw-call budget assertion helpers, pool growth limits, and packet-callback purity.
- **Pass criteria:** The automated assertions pass for:
  1. `HeapSampler` — reports `unavailable` when `performance.memory` is absent.
  2. `DrawCallSampler` — reports `unavailable` when `renderer.info` is missing.
  3. `assertNoUnboundedGrowth` — passes, fails, or unavailable based on before/after samples.
  4. `assertDrawCallBudget` — passes, fails, or manual-required based on draw-call sample.
  5. Pool growth for `RenderObjectPool`, `MeshPool`, and `InstanceBucket` stays within bounds.
  6. `ClientPacketApplier` and `ClientPacketIngestor` do not create Three.js meshes inside packet handlers.
- **Manual sub-gates:**
  - `Draw-call budget assertions` — the live WebGL draw-call assertion runs only when a real WebGL context is present; in headless/jsdom it reports `manual-required`.
  - `Browser-only metrics` — heap sampling and draw-call sampling report `unavailable` or `manual-required` in CI, never a fake measured value.

## 4. Status Legend

Every gate in the report uses exactly one of these four statuses.

| Status | Color in report | CI impact | When to act |
|--------|-----------------|-----------|-------------|
| **passed** | `PASSED` | None | No action needed. |
| **failed** | `FAILED` | Blocks CI | Fix the regression before merging. |
| **skipped-unavailable** | `SKIPPED` | Does not block CI | The harness could not measure the metric because a required browser API or environment was missing. Review the skip reason; if it is unexpected, investigate the test environment. |
| **manual-required** | `MANUAL` | Does not block CI | The metric requires a real browser, GPU, or human judgment. The reviewer should run the manual steps listed in the gate target before approving. |

## 5. Exit Codes

| Mode | Pass | Fail | Skip-only |
|------|------|------|-----------|
| `bun scripts/render-stress-report.ts` | Exit `0` | Exit `1` | Exit `0` |
| `bun scripts/render-stress-report.ts --ci` | Exit `0` | Exit `1` | Exit `0` |

A `SKIP` result (all CI gates skipped, none failed) exits `0` but prints a warning. This is intentional: a skipped gate is not a regression, but it is also not evidence of health.

---

*Last updated: 2026-06-04*

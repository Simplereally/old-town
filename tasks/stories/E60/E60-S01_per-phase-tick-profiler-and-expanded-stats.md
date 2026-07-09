# E60-S01 — Per-phase tick profiler and expanded kernel stats

## Epic

E60 — Observability and Operations Surface

## Dependency chain

- Depends on: none
- Blocks: E60-S02

## Objective

Break the single `lastTickDurationMs` number into per-phase visibility with rolling
distributions, at a cost too small to measure.

## Implementation guidance

- **Wrap point**: `wireTickPhases` (`simulation-kernel.ts:345–581`) registers named phases —
  wrap each callback in a timing shim at registration. Phase names become the metric keys;
  do not rename phases (E56 replay attribution and this profiler should agree on names).
- **Aggregation**: per phase, a fixed-size ring of the last N=256 durations (float ms is fine
  — this is telemetry, not gameplay; the integer-world invariant does not apply) + running
  max since boot. Derive p50/p95 on demand in `stats()`, not per tick.
- **Expanded `stats()`**: keep the existing shape backward-compatible (tests reference it);
  add `phases: {name: {p50, p95, max, lastMs}}`, `slowTicks: [{tick, totalMs, worstPhase}]`
  ring of the last 32 ticks over a threshold (default 100 ms, option-tunable), plus
  `uptimeTicks`, session count, command-buffer depth — read what the kernel already knows and
  expose it.
- **Overhead discipline**: two `performance.now()` calls per phase per tick. Benchmark-test
  the shim (10k wrapped no-op phases) as a regression tripwire; assert profiling adds < 2%
  to a scripted 1000-tick run.
- **Telemetry vs replay**: timing is nondeterministic by nature — confirm nothing in the
  profiler writes into world state (E56-S01's fence script must not flag it: telemetry-only
  classification; add to the allowlist with justification if the scan hits it).

## Required work

- [ ] Timing shim + rings + expanded stats shape + threshold option.
- [ ] Tests: phase attribution correct (rig one slow phase, see it in `slowTicks`); stats
      shape stable; overhead benchmark.
- [ ] Update anything asserting on the old stats shape.

## Acceptance criteria

- [ ] A deliberately slowed phase is identifiable from `stats()` alone within one tick.
- [ ] Zero allocations per tick beyond the ring writes (review criterion — no per-tick object
      churn in the shim).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

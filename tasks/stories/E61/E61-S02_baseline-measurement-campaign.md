# E61-S02 — Baseline measurement campaign and the scaling report

## Epic

E61 — Scale Proving: Bot Fleet, Baselines, and the Delta-Path Diet

## Dependency chain

- Depends on: E61-S01, E60 complete
- Blocks: E61-S03

## Objective

Run the campaign, get the numbers, name the enemies. No code changes to the engine in this
story (harness/instrument fixes only).

## Required work

- [ ] **Campaign matrix**: {10, 50, 100, 200} bots × {town-mix, worst-case} scenarios ×
      ≥ 5-minute steady state, on documented hardware. Collect: E60 phase p50/p95/max, per-
      session + total bandwidth, memory over time (leak check — rss slope), command
      throughput, harness-side latency distribution.
- [ ] **Automate**: `scripts/scale-campaign.ts` orchestrates server boot + fleet + `/statsz`
      polling into one merged report per cell; re-runnable in one command.
- [ ] **The report**: `docs/engine/scaling-report.md` — capacity number (bots at p95 > 80%
      budget = 480 ms), the phase-level cost breakdown at the wall, bandwidth per bot at each
      scale, memory slope, and a ranked top-3 cost list with evidence (this ranking IS
      S03's work order). Include the raw report JSONs under `docs/engine/scale-runs/`.
- [ ] **Sanity instrumentation fixes**: if measurement reveals instrument gaps (e.g. a phase
      that's really three phases, GC pauses misattributed), fix the instruments (E60 code) —
      in scope; engine optimization is NOT.
- [ ] File follow-up notes for anything alarming but out-of-scope (e.g. connect-storm
      handling, memory leak) as marked TODOs in this epic's S03/S04 or a new proposed story.

## Acceptance criteria

- [ ] The report answers, with numbers: how many players fit today, what breaks first, and
      what to fix — each of the top-3 with an estimated win.
- [ ] Campaign is one command; a stranger with the repo + doc can reproduce within noise.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- Manual: `bun scripts/scale-campaign.ts --full` (record hardware + results in the report)

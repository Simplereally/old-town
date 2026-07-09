# E61-S04 — Capacity regression lane and load-test runbook

## Epic

E61 — Scale Proving: Bot Fleet, Baselines, and the Delta-Path Diet

## Dependency chain

- Depends on: E61-S03
- Blocks: none (last story)

## Objective

Lock the gains: an automated check that fails on capacity regression, and a runbook so any
contributor can re-measure.

## Required work

- [ ] **Regression check**: `bun run test:capacity` — a scaled-DOWN cell (e.g. 25 bots,
      60 s, town-mix) with pinned thresholds derived from S03 finals (p95 tick + bytes/bot,
      each with ~20% headroom for machine variance). Runs in the heavy lane (E50 conventions)
      if CI hardware is steady enough — MEASURE CI variance first over 10 runs; if too noisy,
      make it a documented pre-release manual gate instead and say so in the runbook (a flaky
      capacity gate is worse than none).
- [ ] **Thresholds as data**: `scripts/capacity-thresholds.json` with a comment trail — the
      update procedure (intentional regression must edit the file, reviewable like a golden).
- [ ] **Runbook**: finish `docs/engine/load-testing.md` — full campaign procedure, hardware
      notes, how to read the report, when to update thresholds, the S02→S03 history as the
      worked example.
- [ ] Wire `tasks:status`-style discoverability: mention the lane in the root README's
      testing section (find where test lanes are documented — E50 established them).

## Acceptance criteria

- [ ] A deliberate re-introduction of per-session re-serialization (scratch branch) fails
      `test:capacity` (or the manual gate procedure catches it — demonstrate whichever
      shipped).
- [ ] Runbook validated by running it start-to-finish once, as written.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- `bun run test:capacity` (or the documented manual gate)

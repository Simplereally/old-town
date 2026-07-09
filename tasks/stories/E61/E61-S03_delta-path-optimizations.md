# E61-S03 — Delta-path optimizations driven by the measurements

## Epic

E61 — Scale Proving: Bot Fleet, Baselines, and the Delta-Path Diet

## Dependency chain

- Depends on: E61-S02
- Blocks: E61-S04

## Objective

Attack S02's ranked top-3 in order. The candidates below are the code-shape suspects — the
measurements decide which are real and in what order.

## Candidate optimizations (validate against S02 data before building)

- **Serialize-once fan-out**: today each session's send re-serializes
  (`simulation-kernel.ts:571–579` + whatever `transport.send` does — establish exactly where
  stringify happens). Restructure: build the tick's delta as composable pre-serialized
  fragments (per-entity or per-region strings/buffers), so per-session work is selection +
  concatenation, not re-stringification of shared objects. Keep the wire format identical
  unless the report shows format itself is the cost (format changes are a separate decision —
  flag, don't fold in).
- **Interest-manager efficiency**: if `filterDelta` scans the full delta per session, move to
  region-bucketed deltas (group changes by region at build time; per session = union of
  visible region buckets). Read `interest-manager.ts` first — whatever the current mechanism,
  the fix must preserve its visibility semantics exactly (its tests are the contract).
- **Delta-build allocation churn**: if GC shows up in phase timings, pool/reuse the delta
  accumulation structures (`apps/server/src/sim/delta-accumulator` — read it) across ticks.
- **Broadcast payload reuse** (E58-S03 noted it): chat/global packets built once per message,
  not per recipient.

## Required work

- [ ] For each shipped optimization: the S02 baseline number, the change, the after number
      (same campaign cell re-run), in the scaling report's changelog section.
- [ ] Behavior preservation: full suite green; interest-manager visibility tests untouched
      and green; E56 goldens green (if landed) — byte-identical wire output where format is
      unchanged (add a wire-capture comparison test for one scripted multi-session tick:
      before/after refactor fixtures).
- [ ] Stop when: p95 at the S02 capacity point improves ≥ 2× OR the top-3 are exhausted —
      whichever first. Further optimization is a future epic informed by the new report.
- [ ] Re-run the FULL campaign matrix once at the end; update the capacity number.

## Acceptance criteria

- [ ] Measured capacity strictly improved with evidence; no behavior change (suite + wire
      fixtures + goldens).
- [ ] The scaling report tells the truth about what was done and what it bought.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- Manual: `bun scripts/scale-campaign.ts --full`

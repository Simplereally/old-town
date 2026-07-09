# E61 — Scale Proving: Bot Fleet, Baselines, and the Delta-Path Diet

## Dependency chain

- Depends on: E60 (HARD — the phase profiler and per-session bandwidth metrics are the
  instruments; without them this epic is guesswork). E56 soft (reproducible scale scenarios
  via journals).
- Unlocks: a defensible concurrent-player number; confidence to invite more than a handful of
  testers; E63's world events at population

## Spec references

- `apps/server/src/sim/simulation-kernel.ts:571–579` — the per-tick send loop: for every
  session, `interestManager.filterDelta(entityId, center, delta, world)` then
  `transport.send(...)` — per-session filtering AND per-session serialization every tick.
  This is the known hot path; nothing has ever measured it under load.
- `apps/server/src/net/interest-manager.ts` — current interest filtering (read its complexity
  class before optimizing: per-session scan of the delta? spatial index? — establish the facts
  first)
- `scripts/stress-sim.ts` — existing sim-level stress (kernel-only, no transport, no real
  sockets). `scripts/render-stress-report.ts` / `stress-render-props.ts` — the client has
  stress precedent; the SERVER-with-real-connections lane does not exist.
- `apps/server/src/net/websocket-transport.ts` — real `ws` sockets; the fleet connects here
- 🔒 600 ms tick budget is the whole game: the epic's single question is "how many concurrent
  players before a tick exceeds its budget, and what breaks first?"

## Epic goal

Build a bot fleet that connects real WebSocket clients doing real gameplay, measure where the
tick budget and bandwidth actually go at 10/50/100/200 bots using E60's instruments, fix the
biggest measured costs (serialize-once fan-out, interest-manager efficiency, delta-build
allocation churn — as measurement dictates), and pin the achieved capacity with a regression
lane so it can never silently rot.

## Design invariants (bind every story)

- MEASURE before optimizing. Every optimization story cites the baseline number it attacks
  and reports the number it achieved. No speculative optimization lands without a before/after.
- Bots are real clients: real WebSocket, real intents through `routeCommand`, real interest
  sets. No kernel-internal shortcuts in the fleet path.
- Optimizations must not change observable behavior: same packets (modulo field ordering if
  serialization changes — decide and pin), same gameplay. E56 goldens (if landed) must stay
  green through every optimization.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E61/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E61-S01` — [Bot fleet harness: scripted real-socket players](../stories/E61/E61-S01_bot-fleet-harness.md)
- [ ] `E61-S02` — [Baseline measurement campaign and the scaling report](../stories/E61/E61-S02_baseline-measurement-campaign.md)
- [ ] `E61-S03` — [Delta-path optimizations driven by the measurements](../stories/E61/E61-S03_delta-path-optimizations.md)
- [ ] `E61-S04` — [Capacity regression lane and load-test runbook](../stories/E61/E61-S04_capacity-regression-lane-and-runbook.md)

## Epic acceptance criteria

- [ ] `bun scripts/bot-fleet.ts --bots 100 --scenario town-mix --duration 600` runs against a
      dev server and emits a machine-readable report (tick p95 per phase, per-session
      bandwidth, error counts).
- [ ] A written scaling report states the measured capacity (bots at which tick p95 crosses
      80% of budget) before and after S03, with the top-3 cost centers named and quantified.
- [ ] The delta path serializes shared state once per tick, not once per session (or the
      report proves why that's not the win the code shape suggests — measurement rules).
- [ ] A CI-runnable (or documented manual, if CI hardware can't) capacity check fails when
      p95 tick time at the pinned bot count regresses > 20%.

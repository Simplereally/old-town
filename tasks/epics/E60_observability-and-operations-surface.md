# E60 — Observability and Operations Surface

## Dependency chain

- Depends on: nothing
- Unlocks: E61 (hard — the phase profiler and bandwidth metrics ARE the measuring tools for
  scale work); incident response for everything else; admin/moderation basics

## Spec references

- `apps/server/src/sim/simulation-kernel.ts:830–840` — `stats()` today: tick, entity count,
  `lastTickDurationMs` (set at line 649 via `performance.now()`), `lastDeltaSizeBytes`
  (line 579 — measured as `JSON.stringify` of the UNFILTERED delta, so it overstates what any
  session receives)
- `apps/server/src/sim/simulation-kernel.ts:345–581` — `wireTickPhases`: the phase list is
  already a first-class array of named callbacks — the profiler wraps here
- `apps/server/src/logger.ts` — structured Logger already exists; use it, don't add a logging
  dep
- `apps/server/src/persistence/metrics.ts` — persistence layer already tracks its own metrics;
  the HTTP surface should expose these too
- `apps/server/src/server.ts` — where the WebSocket server binds; the HTTP endpoints mount
  alongside
- `apps/server/src/net/delta-transport.ts` + `websocket-transport.ts` — per-session send path
  for bandwidth accounting
- E56-S05 leaves a marked TODO: journal dump wired to the admin surface — close it here

## Epic goal

See inside the running server and act on what you see. Per-phase tick timing, per-session
bandwidth truth, a plain-HTTP stats/health surface, and a minimal authenticated admin command
set (announce, kick, teleport, item-grant with audit). Everything rides existing machinery:
the phase array, the Logger, the persistence metrics, the economy audit.

## Scope guardrails

- No Prometheus/OTel/Grafana dependencies — a JSON endpoint is enough at this scale; the
  format should be trivially scrapeable later.
- Admin surface is dev/ops-grade (env-token gated HTTP + in-game command for announce), not a
  moderation product. No web UI.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E60/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E60-S01` — [Per-phase tick profiler and expanded kernel stats](../stories/E60/E60-S01_per-phase-tick-profiler-and-expanded-stats.md)
- [ ] `E60-S02` — [Per-session bandwidth and delta-path truth metrics](../stories/E60/E60-S02_per-session-bandwidth-and-delta-truth-metrics.md)
- [ ] `E60-S03` — [HTTP stats and health surface](../stories/E60/E60-S03_http-stats-and-health-surface.md)
- [ ] `E60-S04` — [Admin commands with audit trail](../stories/E60/E60-S04_admin-commands-with-audit-trail.md)

## Epic acceptance criteria

- [ ] `curl /statsz` on a running dev server returns JSON with per-phase p50/p95/max timings,
      per-session bandwidth, entity/session counts, persistence queue depth, and uptime.
- [ ] `/healthz` distinguishes live (process up) from ready (tick loop running, persistence
      reachable) and degrades correctly when the tick loop stalls.
- [ ] The answer to "which phase made tick 4512 slow?" is one curl away.
- [ ] An admin can announce, kick, teleport, and grant an item; every admin action lands in
      the audit trail with actor attribution; no admin path works without the token.

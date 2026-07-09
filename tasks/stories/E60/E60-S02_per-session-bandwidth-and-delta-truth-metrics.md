# E60-S02 — Per-session bandwidth and delta-path truth metrics

## Epic

E60 — Observability and Operations Surface

## Dependency chain

- Depends on: E60-S01
- Blocks: E60-S03

## Objective

Replace the misleading `lastDeltaSizeBytes` (unfiltered-delta measurement,
`simulation-kernel.ts:579`) with per-session truth: what each connection actually receives.

## Implementation guidance

- **Measure at the send**: the honest place is where bytes leave —
  `delta-transport.ts`/`websocket-transport.ts` `send`. Record per-session counters:
  bytes sent (post-filter, post-serialize — measure the actual serialized payload once,
  where it is serialized), packets sent, last-delta bytes, and a small rolling
  bytes-per-second window. If serialization currently happens per-session inside
  `transport.send`, measure there and leave a marked note for E61-S03 (which will
  restructure this path — the metric must survive that refactor; define it as "bytes handed
  to the socket").
- **Fix the global metric**: `lastDeltaSizeBytes` becomes the SUM of per-session sent bytes
  for the tick (rename to `lastTickBytesOut`; keep the old key as a deprecated alias one
  release if tests bind to it — check and decide).
- **Command-side counters** too: per-session commands received / rejected / spam-capped
  (`routeCommand` already knows; count there).
- **Exposure**: `stats().sessions: [{id, entityId, bytesOut, bytesPerSec, packets,
  cmdsReceived, cmdsRejected, connectedTicks}]`.

## Required work

- [ ] Per-session counters at the transport send + command intake; kernel stats exposure.
- [ ] Replace/alias the old delta-size metric; fix its callers/tests.
- [ ] Tests: two sessions with different interest sets report different bytes (the filtered
      truth — this is the whole point); counters reset on disconnect; rolling window sane
      under fake timers.

## Acceptance criteria

- [ ] For a two-session run where one player is alone in a far region, their bytesOut is
      measurably smaller — the metric proves interest filtering works (this becomes E61's
      baseline instrument).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

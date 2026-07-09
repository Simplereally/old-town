# E61-S01 — Bot fleet harness: scripted real-socket players

## Epic

E61 — Scale Proving: Bot Fleet, Baselines, and the Delta-Path Diet

## Dependency chain

- Depends on: none (E60 needed by S02)
- Blocks: E61-S02

## Objective

`scripts/bot-fleet.ts`: N scripted players over real WebSockets, doing a realistic mix of
gameplay, with per-bot and aggregate client-side metrics.

## Implementation guidance

- **Connection**: reuse the client's protocol layer if importable without the DOM — check
  what `apps/client/src/game/net/GameSocket.ts` depends on; if it's DOM-entangled, write a
  minimal node/bun WebSocket client speaking the same protocol (packets are shared-schema'd —
  `packages/shared` has everything needed; this is the likely path and also documents the
  protocol's client-independence). Session bootstrap must follow whatever the dev-session
  handshake requires (`apps/server/src/net/dev-session.ts` — read the handshake).
- **Behaviors**: a small behavior-script interpreter per bot: `wander` (random walk within a
  region, seeded per-bot rng — the FLEET may use seeded randomness freely; it is outside the
  sim), `chopper` (walk to tree, chop, bank), `fighter` (attack NPC, eat), `chatter` (periodic
  local chat), `idler`. `--scenario town-mix` = weighted mix; `--scenario worst-case` = all
  bots co-located in one region (interest-filtering's worst case — everyone sees everyone).
- **Client-side metrics**: per bot — packets/bytes received, time-to-first-delta, intent→
  observed-effect latency for moves (send MoveIntent, watch for own position change: measures
  full round trip in ticks), disconnect/error counts. Aggregate into the report JSON.
- **Process model**: bots are I/O-bound; hundreds should fit one process — but measure and
  support `--processes N` sharding if event-loop saturation on the CLIENT side would corrupt
  the measurements (the harness must not be the bottleneck; assert harness CPU < 50% of a
  core per 100 bots or shard).
- **Determinism note**: fleet runs are NOT deterministic (network timing) — that's fine; they
  measure, they don't regress gameplay. E56 goldens do that.

## Required work

- [ ] Protocol client + handshake + behavior interpreter + the five behaviors + scenarios.
- [ ] Metrics collection + JSON report output (`--out report.json`).
- [ ] Graceful ramp: `--ramp <per-sec>` connect rate (thundering-herd connects are a separate
      finding, not a crash).
- [ ] Tests for the harness itself: behavior scripts against a local kernel-backed server
      fixture (a 3-bot smoke in the normal suite; big runs are manual/S04-lane).
- [ ] `docs/engine/load-testing.md` started: how to run, scenario definitions.

## Acceptance criteria

- [ ] 50 bots for 5 minutes against `bun run dev`: zero harness-side errors, report written,
      server survives (whatever the numbers say — S02 judges them).
- [ ] A bot is indistinguishable from a real client at the protocol level (review criterion:
      no privileged endpoints, no skipped validation).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- Manual: `bun scripts/bot-fleet.ts --bots 50 --scenario town-mix --duration 300`

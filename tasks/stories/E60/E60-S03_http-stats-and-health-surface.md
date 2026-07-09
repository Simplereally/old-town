# E60-S03 — HTTP stats and health surface

## Epic

E60 — Observability and Operations Surface

## Dependency chain

- Depends on: E60-S02
- Blocks: E60-S04

## Objective

`GET /statsz`, `GET /healthz` on the game server process — the scrape surface for humans,
scripts, and E61's harness.

## Implementation guidance

- Mount HTTP handling where the server already listens (`apps/server/src/server.ts` — read
  how the WebSocket upgrade is handled; Bun's `serve` fetch handler can route plain GETs
  alongside the upgrade path — verify the actual server construction and follow it).
- **`/statsz`**: JSON dump of kernel `stats()` + persistence metrics
  (`apps/server/src/persistence/metrics.ts` — read its shape and include it) + process facts
  (rss, heapUsed, uptime). Reading stats must be safe from the HTTP context: `stats()` is
  synchronous on the same event loop as ticks — confirm it only reads (it does today; keep it
  that way with a comment).
- **`/healthz`**: `{live: true, ready: bool, detail}` — ready requires: tick loop advancing
  (last tick started within 3 tick-lengths), persistence adapter answering (a cheap ping —
  check what the adapter interface offers; add a `ping()` if absent, trivial for memory/file,
  `SELECT 1` for postgres), no crash-looping subsystem. Return 200/503 by readiness (curl-able
  and load-balancer-compatible).
- **Access**: bind assumptions documented — these endpoints expose player names/session data,
  so gate behind `OLD_TOWN_STATS_TOKEN` if set (query/header token), open in dev when unset.
- Journal-dump endpoint placeholder: `POST /adminz/journal-dump` lands in S04 with auth —
  don't ship it unauthenticated here.

## Required work

- [ ] Routes + token gate + persistence ping + readiness logic.
- [ ] Tests: statsz shape; healthz flips to 503 when the tick loop is stalled (rig a fake
      kernel); token enforcement.
- [ ] `docs/engine/operations.md`: the endpoints, the token, what each field means, example
      curl invocations.

## Acceptance criteria

- [ ] Dev server: `curl localhost:<port>/statsz | jq .phases` works mid-game without a tick
      hitch.
- [ ] healthz correctly 503s within 2 s of a stalled tick loop.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

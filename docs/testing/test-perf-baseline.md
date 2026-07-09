# Test Suite Performance Baseline (E50)

**Date:** 2026-07-09  
**Machine:** Apple M3 (arm64), 8 cores, macOS darwin 24.6.0  
**Command:** `bunx vitest run --reporter=json --outputFile=/tmp/old-town-e50/vitest-report.json`  
**Reporter parse:** `bun scripts/report-test-timings.ts <report>`

## Headline numbers (before any E50 changes)

| Metric | Value |
|--------|------:|
| Files | 232 |
| Tests | 2733 (2721 passed / 0 failed; remainder skipped) |
| Wall time | **64.33 s** |
| CPU-summed file time | 16.97 s |
| Target end-state | Fast lane (`bun run test`) **&lt; 60 s** locally; zero real sleeps &gt; 50 ms in the fast lane |

Wall ≫ CPU-sum because vitest parallelizes across workers; wall is the scoreboard humans feel.

## Top 20 slowest files (classified)

Buckets:

- **A — real-time waits:** `await sleep` / real `setTimeout` / wall-clock tick waits
- **B — real I/O:** real WebSocket / HTTP listen / real ports / real postgres
- **C — heavy compute:** Three.js stress/perf, large content loads, long tick sims, integration loops
- **D — legitimately fast-but-many:** leave alone (many small assertions; no wall sleeps)

| Rank | Duration (ms) | Tests | ms/test | Bucket | File |
|-----:|--------------:|------:|--------:|:------:|------|
| 1 | 2421 | 6 | 403.4 | **B** (+A) | `apps/server/src/net/multiplayer-loop.integration.test.ts` |
| 2 | 1611 | 7 | 230.2 | **C** | `apps/client/src/game/renderer/stress/region-crossing.perf.test.ts` |
| 3 | 1192 | 12 | 99.3 | **C** | `apps/server/src/sim/simulation-kernel.test.ts` |
| 4 | 1071 | 7 | 152.9 | **C** | `apps/server/src/net/dev-session.test.ts` |
| 5 | 879 | 1 | 878.9 | **C** | `apps/server/src/sim/first-hour-loop.integration.test.ts` |
| 6 | 787 | 4 | 196.7 | **C** | `apps/server/src/world/region-loader.test.ts` |
| 7 | 744 | 11 | 67.7 | **C** | `apps/client/src/game/renderer/stress/entity-scale.perf.test.ts` |
| 8 | 643 | 44 | 14.6 | **D** | `apps/client/src/game/ui/UIManager.test.ts` |
| 9 | 586 | 8 | 73.3 | **C** | `apps/server/src/systems/topology-e43s06.test.ts` |
| 10 | 523 | 3 | 174.3 | **C** | `apps/server/src/persistence/session-leasing.integration.test.ts` |
| 11 | 387 | 11 | 35.2 | **C** | `apps/client/src/game/renderer/stress/instanced-props.perf.test.ts` |
| 12 | 258 | 2 | 129.0 | **C** | `apps/server/src/sim/goblin-balance-sim.perf.test.ts` |
| 13 | 240 | 26 | 9.2 | **D** | `apps/client/src/game/GameEngine.test.ts` |
| 14 | 235 | 10 | 23.5 | **C** | `apps/server/src/sim/gameplay-loop.integration.test.ts` |
| 15 | 235 | 3 | 78.2 | **C** | `apps/server/src/items/item-audit.test.ts` |
| 16 | 197 | 75 | 2.6 | **D** | `apps/client/src/game/scene/ActorRenderer.attachment.test.ts` |
| 17 | 184 | 6 | 30.7 | **D** | `apps/server/src/world/pathfinding.test.ts` |
| 18 | 181 | 10 | 18.1 | **D** | `apps/server/src/systems/approach.test.ts` |
| 19 | 164 | 7 | 23.5 | **C** | `apps/client/src/game/renderer/stress/snapshot-jitter.perf.test.ts` |
| 20 | 146 | 12 | 12.2 | **D** | `apps/client/src/game/GameEngine.snapshot-playout.test.ts` |

### Notable files outside the top 20 (still relevant to E50)

| Duration (ms) | Bucket | File | Notes |
|--------------:|:------:|------|-------|
| 85 | **B** | `apps/server/src/net/socket-command-movement.test.ts` | Real HTTP + WebSocket |
| 74 | **A** | `apps/client/src/game/ui/ContextMenu.test.ts` | Two `setTimeout(..., 10)` sleeps |
| 47 | **B** | `apps/server/src/net/websocket-transport.integration.test.ts` | Real HTTP + WebSocket |
| 32 | **C** | `apps/client/src/game/scene/ActorRenderer.pooling.test.ts` | Story candidate; already fast |
| 14 | **C** | `apps/client/src/game/scene/lowpoly.test.ts` | Story candidate; already fast |
| 11 | **C** | `apps/client/src/game/scene/TerrainLayer.e42s05-perf.test.ts` | Story candidate; already fast |
| 10 | **C** | `apps/client/src/game/renderer/stress/heap-gate.perf.test.ts` | Stress suite |

### Bucket A inventory (grep)

```
apps/client/src/game/ui/ContextMenu.test.ts          — setTimeout(resolve, 10) ×2
apps/server/src/net/multiplayer-loop.integration.test.ts — setTimeout waiter + setTimeout(resolve, 0)
```

No `Bun.sleep` / named `sleep(` helpers found under `apps/**/*.test.ts`.

### Bucket B inventory (real sockets)

```
apps/server/src/net/multiplayer-loop.integration.test.ts
apps/server/src/net/websocket-transport.integration.test.ts
apps/server/src/net/socket-command-movement.test.ts
```

Postgres suites are already gated behind `bun run test:postgres` (not in default vitest include).

## Planned end-state (scoreboard for S02/S03)

| Lane | Command | Membership | Target |
|------|---------|------------|--------|
| Fast (unit) | `bun run test` | All `*.test.ts` except heavy globs | &lt; 60 s wall; no real sleeps &gt; 50 ms |
| Heavy | `bun run test:heavy` | `*.integration.test.ts`, `*.perf.test.ts`, `*.perf.test.ts`, plus any remaining real-socket smokes after rename | Green; may be slow |
| All | `bun run test:all` | Both projects | Green |

## After-story columns

| Story | Wall (all / unit / heavy) | Notes |
|-------|---------------------------|-------|
| **S01 (this baseline)** | 64.33 s / — / — | Measurement only; no test changes |
| **S02** | **56.07 s** / — / — | ContextMenu → fake timers; socket-command-movement → command-buffer direct; multiplayer-loop behavioral matrix → kernel + collecting `DeltaTransport`; real-socket smokes tagged `// @heavy` + `heavy:` describe. `bun run test:no-sleeps` green. |
| **S03** | all **56.09 s** / unit **50.33 s** / heavy **5.09 s** | Vitest projects `unit` + `heavy`. Renames: `*.stress.test.ts` → `*.perf.test.ts`; `websocket-transport` → `.integration.test.ts`; `goblin-balance-sim` → `.perf.test.ts`. Unit uses `pool: "threads"` + `isolate: false` (3 consecutive green runs). |

### S02 before/after for converted files

| File | Before (ms) | After (ms) | Change |
|------|------------:|-----------:|--------|
| `ContextMenu.test.ts` | 74 | ~33 | Fake timers |
| `socket-command-movement.test.ts` | 85 | ~18 | No sockets |
| `multiplayer-loop.integration.test.ts` | 2421 | ~1759 | Kernel-direct matrix + 1 ws smoke; remaining cost is 200-tick interest loop (bucket C → heavy lane in S03) |
| `websocket-transport.integration.test.ts` | 47 | ~32 | Tagged `@heavy` (still real sockets) |

## Reproducing this report

```bash
bunx vitest run --reporter=json --outputFile=/tmp/vitest-report.json
bun scripts/report-test-timings.ts /tmp/vitest-report.json --top 20
```

# Performance Checks

This page records the current POC performance probes and the latest local stress baseline.

## Debug Counters

Client counters are shown in the dev debug overlay:

- frame time
- draw calls
- Three.js geometry count
- Three.js texture count
- rendered actors
- rendered objects
- loaded chunks

Server counters are exposed by `kernel.stats()` and the `GET /debug/stats` route:

- current tick and server time
- last tick duration in milliseconds
- alive entity count
- pending and last-processed command counts
- last raw delta packet size in bytes
- connected session, region, and tile counts
- pending and in-flight character save queue counts

## Stress Harness

Run the simulation stress harness from the repo root:

```sh
PLAYERS=25 TICKS=100 bun run stress:sim
```

The harness connects accountless dev sessions, attaches the normal delta broadcaster, routes one
move command per player per tick, and runs the seeded NPC/action systems through the production
simulation kernel.

Latest local sample, 2026-05-31:

```json
{
  "players": 25,
  "ticks": 100,
  "elapsedMs": 485.67,
  "msPerTick": 4.86,
  "sentDeltaPackets": 2500,
  "sentDeltaBytes": 24630600,
  "lastTickDurationMs": 3.86,
  "lastCommandsProcessed": 25,
  "aliveEntityCount": 106,
  "pendingCommandCount": 0,
  "lastDeltaSizeBytes": 9764,
  "saveQueuePendingCount": 26,
  "saveQueueInFlightCount": 250
}
```

## Current Bottlenecks

- Terrain currently renders one mesh per tile. Chunk unload now detaches tile meshes without
  disposing shared geometry, but draw calls still scale with loaded tile count. The next renderer
  improvement is chunk batching or instancing by material.
- Object and actor renderers use shared geometry/material resources. Entity removal now detaches or
  pools meshes; shared resources are disposed only when the layer is disposed.
- Delta broadcast cost scales with connected sessions because every tick filters and serializes
  per-session packets. `lastDeltaSizeBytes` measures the raw delta; `sentDeltaBytes` from the stress
  harness shows the fan-out cost.
- The stress harness runs ticks back-to-back without a 600 ms event-loop gap, so async save promises
  can accumulate in `saveQueueInFlightCount`. Before raising player counts, persistence needs
  batching/backpressure and coalescing for frequently dirty player state.

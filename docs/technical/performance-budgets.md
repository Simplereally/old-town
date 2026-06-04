# Performance Budgets and Diagnostics Contract

> **Authority:** This document defines exact performance budgets, diagnostics contracts, stress harnesses, and backend gating rules for the Old Town client. E32-E35 may not relax, ignore, or bypass these budgets without amending this document.

## 1. Budget Table

The following targets are the POC performance contract. Every number is a hard ceiling, not an aspiration.

| Budget | Target | Gate type | Notes |
|--------|--------|-----------|-------|
| Frame time p95 | `< 16.6 ms` | CI-enforceable | 60 Hz target; measured over a 60-second window. |
| Frame time p99 | `< 33 ms` | CI-enforceable | Graceful degradation bound; a single frame may spike to 33 ms, but no sustained pattern. |
| Visible town draw calls | `< 150` | CI-enforceable | Full visible town at default camera distance. |
| Optimized draw calls | `< 75` | CI-enforceable | After occlusion, back-face culling, and frustum culling. |
| Chunk GPU upload budget | `< 2 ms / frame` | CI-enforceable | CPU time spent uploading baked chunk geometry to GPU. |
| Snapshot ingest | `< 1 ms` | CI-enforceable | Decode, validate, reduce, and write one snapshot to `SnapshotBuffer`. |
| Visible entities | `200` | CI-enforceable | Actors, NPCs, creatures, and ground items in the visible set. |
| Render-cached stress entities | `1000` | CI-enforceable | Entities resident in render cache (including off-screen) without eviction. |
| Visible instanced props | `5000+` | CI-enforceable | Static props, rocks, fences, signs, etc. in visible frustum. |
| Stress instanced props | `30000+` | Manual / browser-only | Full region load at maximum density; requires GPU memory headroom. |
| Heap after 10 minutes idle | Flat | Manual / browser-only | No upward trend in JS heap size after 10 minutes of idle standing. |

**Gate type legend:**

- **CI-enforceable:** The harness can measure this in a headless or browser-automation test and fail the build if the ceiling is breached.
- **Manual / browser-only:** The metric requires a real browser, GPU, or human judgment. It is recorded in the stress report but does not block CI.

## 2. Hot Loop Allocation Standard

The target is zero app-level allocations in hot loops and flat heap under stress, not literal browser-wide `0 B/s`. The following loops and systems must not perform new object, array, function, or closure allocation after initial warmup:

- `onFrame` / `requestAnimationFrame` callback
- Snapshot sampling (reading two snapshots to produce interpolation inputs)
- Snapshot ingest (decode, validate, reduce, write)
- Bucket flush (clearing / recycling instances before new frame write)
- Instance matrix write loop (per-entity `Float32Array` write into bucket)
- Projectile update loop
- Hitsplat update loop (position, lifetime, fade)
- Actor transform update loop
- Picking target refresh loop
- Chunk visibility update loop
- Upload queue drain loop
- Worker message dispatch loop

**Permitted tools:** Pre-allocated typed arrays, fixed-size ring buffers, object pools, `Float32Array` subarray views, and numeric arithmetic. If a loop needs a temporary vector, it must be drawn from a per-frame or per-thread pool and returned immediately.

**Ban:** No `new Object`, `new Array`, object literals, array growth, string concatenation, `map`/`filter`/`reduce` that creates closures, or `JSON.parse` in any loop listed above.

## 3. Required Metrics

The client diagnostics system must collect and surface the following metrics. All are required unless marked optional.

| Metric | Source | Unit | Purpose |
|--------|--------|------|---------|
| Frame time | `RenderClock` | ms | Primary health metric. Sampled every frame, reported as p50/p95/p99 over 1 s and 10 s windows. |
| Draw calls | Three renderer info | count | Per-frame draw call count. Must correlate with the 150/75 budget. |
| Geometries | Three renderer info | count | Total geometry objects in GPU memory. |
| Textures | Three renderer info | count | Total texture objects in GPU memory. |
| Actors | `RenderPresentationSystem` | count | Visible actor instances. |
| Objects | `RenderPresentationSystem` | count | Visible object / ground-item instances. |
| Loaded chunks | `TerrainLayer` | count | Chunks in `gpu_resident` or `visible` state. |
| Snapshot buffer depth | `SnapshotBuffer` | count | Number of accepted snapshots currently buffered. |
| Upload queue depth | `TerrainLayer` | count | Chunks waiting in `baked_waiting_gpu_upload` state. |
| Worker queue depth | Chunk bake worker | count | Outstanding `BAKE_REQUEST` messages not yet answered. |
| Heap sample | `performance.memory` (Chrome) or `gc` telemetry | MB | JS heap size sampled every 5 s. |
| GPU time | `EXT_disjoint_timer_query` | ms | **Optional.** Per-frame GPU elapsed time. Gracefully no-ops when the extension is unavailable. |

**Optional GPU timing rule:** When `EXT_disjoint_timer_query` is unavailable, the GPU time metric must report `null` and must not degrade frame performance, throw errors, or produce console warnings. The absence of GPU timing must never break the debug overlay or stress report.

## 4. Renderer HUD

The debug overlay is a DOM layer toggled by a dev key (default: backtick). It is off in production builds.

### Labels

| Label | Value | Example |
|-------|-------|---------|
| `FPS` | Instant frame rate | `60` |
| `FT` | Frame time (ms) | `12.4` |
| `DC` | Draw calls | `87` |
| `GEO` | Geometry count | `42` |
| `TEX` | Texture count | `18` |
| `ACT` | Visible actors | `23` |
| `OBJ` | Visible objects | `14` |
| `CHK` | Loaded chunks | `9` |
| `SBF` | Snapshot buffer depth | `4` |
| `UQ` | Upload queue depth | `0` |
| `WQ` | Worker queue depth | `1` |
| `HEAP` | JS heap size | `42.1 MB` |
| `GPU` | GPU time (optional) | `4.2 ms` or `—` |

### Update Frequency

- `FPS` and `FT`: every frame, smoothed with an exponential moving average (alpha = 0.1).
- `DC`, `GEO`, `TEX`: every frame, read from `renderer.info`.
- `ACT`, `OBJ`, `CHK`: every frame, read from layer counters.
- `SBF`, `UQ`, `WQ`: every 5 frames (12 Hz at 60 FPS) to avoid polling overhead.
- `HEAP`: every 5 seconds.
- `GPU`: every frame when the extension is available; otherwise hidden.

## 5. Stress Harnesses

Stress tests use deterministic fake data wherever possible. Browser or manual gates are used where WebGL metrics cannot be made stable in CI.

### 5.1 Jitter Snapshot Harness

- Simulate network jitter by delaying snapshot delivery with a random `0-200 ms` jitter.
- Run for 60 seconds at 60 FPS.
- **Pass:** No `freeze` or `snap` events except during explicit teleport tests; p95 frame time `< 16.6 ms`.

### 5.2 Region Crossing Harness

- Rapidly cross region boundaries (enter/leave a 96x96 region) every 3 seconds.
- Measure chunk upload queue, worker queue, and frame time during transitions.
- **Pass:** Upload queue depth never exceeds `4`; p95 frame time `< 16.6 ms`; no memory leak after 10 crossings.

### 5.3 1k Entity Harness

- Spawn `1000` entities (mix of actors and objects) in a dense cluster.
- Walk the camera through the cluster.
- **Pass:** Render-cached entity count `<= 1000`; visible entity count `<= 200` at any camera position; p95 frame time `< 16.6 ms`.

### 5.4 10k Instanced Prop Harness

- Populate the visible frustum with `10,000` static instanced props.
- **Pass:** Draw calls `< 75`; p95 frame time `< 16.6 ms`.

### 5.5 30k Optional / Manual Prop Harness

- Load a full region at maximum prop density (`30,000+` instanced props).
- This is a browser-only / manual gate due to GPU memory variance.
- **Pass:** Frame time p95 `< 33 ms`; no GPU memory crash; scene remains interactive.

### 5.6 5-Minute Heap Simulation

- Leave the client idle (no input, no camera movement) for 5 minutes.
- Then run active movement and combat for 5 minutes.
- Sample heap every 5 seconds.
- **Pass:** Heap line is flat (no upward slope > 1 MB / minute) during idle. Heap growth during active play must drop back to baseline within 30 seconds of returning to idle.

## 6. WebGL Production Restrictions

The following operations are banned in production gameplay frames. They may be used during load, prewarm, or explicit menu screens, but never during active play unless explicitly queued and throttled.

| Restriction | Rule |
|-------------|------|
| Runtime material churn | No creation or disposal of `Material`, `MeshBasicMaterial`, `MeshLambertMaterial`, `MeshToonMaterial`, or `ShaderMaterial` inside the render loop. All materials must be created at load time and registered in the central material registry. |
| Per-frame shader compilation | No `onBeforeCompile` triggers that cause a recompile after the initial frame. Shader patches must be registered once at material creation time. |
| Texture upload during combat | No `new Texture`, `texture.needsUpdate = true`, or image upload during combat. Combat textures must be preloaded and resident. Uploads queued before combat are permitted. |
| Blocking readback APIs | No `gl.getError`, `gl.getParameter`, `gl.readPixels`, `renderer.info.reset()`, or any other blocking / stalling WebGL API call inside active gameplay frames. These may be used in a dedicated diagnostics frame or a non-interactive debug screen. |

**Definition of combat:** The player has a valid target, is in an active combat session, or has received a combat event in the last `3` seconds.

## 7. Advanced Backend Gate

The following technologies are gated behind a future ADR and metric evidence. No production code in `master` may depend on them, no architecture decision may assume they exist, and no E32-E34 story may open them.

| Technology | Gate condition |
|------------|----------------|
| `SharedArrayBuffer` | E35 metrics must prove that `postMessage` + transferable buffers is the render bottleneck, and a new ADR must document the threading model, Spectre mitigations, and cross-browser support plan. |
| OffscreenCanvas renderer movement | E35 metrics must prove that main-thread CPU time is the p95 frame-time blocker, and a new ADR must document the worker renderer loop, input routing, and fallback plan. |
| WebGPU | E35 metrics must prove that WebGL draw-call or shader limits are the bottleneck, and a new ADR must document the migration path, fallback to WebGL, and feature detection strategy. |

**Rule:** They may be prototyped in feature branches. They may not merge to `master` without the ADR and metric evidence above.

## 8. Validation

Run the automated boundary checks before any PR that touches renderer-adjacent code:

```bash
bun run render:boundaries
```

This enforces that no gameplay, network, or shared module imports Three.js or mutates renderer-owned objects.

---

*Last updated: 2026-06-04*

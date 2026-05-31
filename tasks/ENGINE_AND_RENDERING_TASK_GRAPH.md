# Engine and Rendering Task Graph

## Source inputs

- `ENGINE_AND_RENDERING.md` is the local findings brief for this task graph.
- `POC_SPEC.md` remains authoritative for Old Town engine behavior; relevant sections are §2, §6, §7, §8, §9, §11, §22, §23, §25, §27, and §28.
- Current code evidence shows `GameEngine` routes `S2C_TICK_DELTA` packets directly into `ClientPacketApplier`, which calls scene layers immediately. This must be replaced by delayed snapshot playout and render-system-owned mutation.
- Current render evidence shows `TerrainLayer` creates one mesh per tile, `ObjectRenderer` creates one mesh/group per object, actors own Three groups directly, and projectiles/hitsplats use ad hoc frame clocks. These are acceptable POC scaffolds, not the scalable architecture.

## External research inputs

- MDN `requestAnimationFrame`: callbacks track display refresh rates such as 60/75/120/144Hz, and animation progress must use the callback timestamp to avoid high-refresh speed errors.
- Gaffer On Games snapshot interpolation: network snapshots should be buffered briefly and rendered at a delayed presentation time instead of rendering packet arrivals immediately.
- Three.js `InstancedMesh`: use instancing for many objects sharing geometry/material; update `instanceMatrix`/`instanceColor` once after batch writes and maintain bounds.
- Three.js `BufferAttribute`: use `needsUpdate`, `updateRanges`, and `usage` deliberately; `usage` must be set before first render.
- MDN transferable objects: `ArrayBuffer` ownership transfer avoids deep copies and detaches the sender buffer.
- MDN `SharedArrayBuffer`: shared memory requires a secure context and cross-origin isolation; it is not a Phase 1 dependency.
- MDN `OffscreenCanvas`: worker rendering is possible and transferable, but it is an advanced renderer-backend experiment, not the current production path.
- MDN WebGL best practices: batch draw calls, avoid blocking API calls such as `getError`, `getParameter`, and CPU `readPixels` in production, treat texture uploads as potential pipeline flushes, and keep WebGL extensions optional.
- MDN `EXT_disjoint_timer_query`: GPU timing can be asynchronous but extension availability is limited, so diagnostics must degrade gracefully.

## Architectural decisions

- Server tick remains authoritative at exactly 600ms.
- Client network callbacks must never mutate `Object3D`, `Mesh`, `Group`, geometry attributes, materials, or renderer state directly.
- The client must use three clocks: server tick clock, snapshot/playout clock, and browser RAF clock.
- Rendered remote entity positions come from a snapshot interpolation buffer keyed by server tick, not packet arrival alpha.
- Local player click/path feedback may appear immediately, but authoritative position remains server-owned.
- Gameplay ECS and render cache stay separate. Render state may use typed arrays for hot fields, but the code must not collapse every component into one monolithic float stride.
- Three objects live behind render handles, registries, instance buckets, and pools. Gameplay/server/shared packages must remain pure data and must not import Three.
- Repeated props, object definitions, ground items, decals, and markers use instanced buckets keyed by `archetype_id + material_id + region_id + layer`.
- Instance matrix/color writes are batched and flushed once per frame per bucket. Bounds are recomputed when bulk transforms affect culling or raycasting.
- Worker asset baking uses transferable `ArrayBuffer`s first. `SharedArrayBuffer`, OffscreenCanvas renderer movement, and WebGPU are deferred until diagnostics prove a need and deployment prerequisites are solved.
- Hot render systems target zero app-level allocations in frame/tick hot paths and flat heap under stress, not a literal browser-wide `0 B/s`.

## Dependency graph

```txt
E30 World Expansion Systems
  -> E31 Render Architecture Contracts
       -> E32 Snapshot Playout and Render State
            -> E33 Render Resource Registry, Instancing, and Pools
                 -> E34 Worker Chunk Baking and Scene Residency
                      -> E35 Rendering Diagnostics and Stress Gates
```

Parallel-read note: E33 can begin design work after E31, but implementation must wait until E32 defines the render-state handoff. E35 depends on measurable surfaces from E32, E33, and E34.

## Epic map

- E31 creates the technical contracts and coding standards future implementation must obey.
- E32 replaces packet-arrival rendering with snapshot playout, render clocks, and render transform cache.
- E33 replaces per-entity/per-tile mesh churn with resource registries, instanced buckets, pools, and mutation-boundary enforcement.
- E34 adds worker asset baking, transferable buffers, upload budgets, chunk lifecycle, and residency.
- E35 adds diagnostics and stress gates for jitter, region crossing, entity scale, prop scale, draw calls, and heap behavior.

## Non-goals for this graph

- Do not implement `SharedArrayBuffer` as a required path.
- Do not move the Three renderer to OffscreenCanvas.
- Do not migrate production rendering to WebGPU.
- Do not make shader procedural deformation the default for gameplay geometry.
- Do not implement a binary delta protocol in this graph; keep JSON packets until E35 metrics prove packet decode/ingest is the bottleneck.
- Do not change server authority, tick cadence, integer tile truth, or content-driven gameplay.

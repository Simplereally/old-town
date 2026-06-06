# Strategy 4: Scalable Future-Proof

> **Scope:** E35+ extension points. Accept more code now to avoid rework later.
> **Authority:** This document gates any E35+ epic that touches chunk residency, render budgets, plane transitions, or material loading. Amend it before introducing new render backend contracts.

## 1. Thesis

The E28-E34 render architecture (snapshot playout, instance buckets, worker chunk baking, resource registry) solves the POC problem: stable 60 Hz, server-authoritative presentation, and zero hot-loop allocation. But the current implementation is hard-coded to a single plane, a single chunk provider, static material factories, and a fixed memory budget. E35+ will need:

- Dungeons and rooftops (multi-plane rendering and camera transitions).
- Dynamic events, instanced regions, and seasonal maps (pluggable chunk providers).
- Quality settings, hardware tiers, and mobile clients (configurable budget policies).
- Large content drops, modding, and UGC (async material loading with streaming).

This strategy inserts extension points into the existing render pipeline so those epics are additive, not destructive. The cost is more interfaces, registries, and policy objects today. The benefit is that E35+ stories do not re-open `ChunkResidencyManager`, `ChunkBakeQueue`, or `RenderResourceRegistry`.

## 2. Principles

1. **Open for extension, closed for modification.** The E34 render core may receive new extension slots, but its existing hot paths must not change semantics.
2. **Policy over configuration.** Budgets, distances, and quality tiers are driven by policy objects, not magic numbers.
3. **Provider pattern for data sources.** Chunk geometry, terrain tiles, and object descriptors come from a provider interface, not a hard-coded `RegionMap` loader.
4. **Async-first for materials.** Materials and textures may be declared at load time but created lazily, with an explicit loading state.
5. **Plane is a first-class render dimension.** The renderer must treat `plane` as orthogonal to `x` and `y`, not as a special case.

## 3. Extension Point: Pluggable Chunk Providers

### 3.1 Current state

`ChunkBakeQueue` and `ChunkResidencyManager` ingest `ChunkMetadata` via `ingestRegionLoad(regionId, chunks[])`. The caller is assumed to be a single region-map loader. The worker receives `RegionTileData[]` and `ObjectRef[]` baked from a single content source.

### 3.2 Future need

- Event maps (e.g., a temporary festival region) that overlay or replace normal chunks.
- Instanced dungeons where the same `RegionId` produces different geometry per player.
- Mod/UGC regions loaded from a CDN or user-provided JSON.

### 3.3 Extension: `ChunkProvider` interface

```ts
export interface ChunkProvider {
  readonly providerId: string;
  /** Return true if this provider owns the given region on the given plane. */
  canProvide(regionId: RegionId): boolean;
  /** Return metadata for all chunks in the region, or null if unavailable. */
  loadRegionMetadata(regionId: RegionId): Promise<ChunkMetadata[] | null>;
  /** Return raw tile and object data for a single chunk bake. */
  loadChunkData(chunkId: ChunkId): Promise<{
    tiles: RegionTileData[];
    objectRefs: ObjectRef[];
  } | null>;
}
```

### 3.4 Integration

- `ChunkBakeQueue` no longer holds a direct region loader. Instead, it holds a `ChunkProviderRegistry`.
- When a region load packet arrives, `ClientPacketApplier` resolves the provider via `registry.resolve(regionId)` and forwards the metadata.
- When a worker dequeues a bake job, the main thread fetches chunk data through the provider before posting to the worker, or the worker itself calls back to a provider proxy (see §6 Async Material Loading).
- Provider resolution is deterministic: the first registered provider that returns `canProvide(regionId) === true` wins. Registration order is explicit and logged.

### 3.5 E35+ story size

An epic that adds a new provider (e.g., `EventChunkProvider`) should be:
- One new file implementing the interface.
- One registration call in `GameEngine` bootstrap.
- Zero changes to `ChunkResidencyManager`, `ChunkBakeQueue`, or `ChunkBakeWorkerClient`.

## 4. Extension Point: Configurable Budget Policies

### 4.1 Current state

`ChunkResidencyManager` is constructed with `visibleRadiusTiles`, `residentRadiusTiles`, and `maxGpuBytes`. These are hard-coded per constructor call. There is no concept of quality tiers, mobile vs desktop, or dynamic scaling under thermal pressure.

### 4.2 Future need

- Mobile clients need smaller radii and lower prop counts.
- Low-power mode should shrink GPU memory and draw-call budgets dynamically.
- A "graphics settings" menu must change budgets without restarting the renderer.
- Stress tests (E35) must verify that each tier stays within its own contract.

### 4.3 Extension: `RenderBudgetPolicy` interface

```ts
export interface RenderBudgetPolicy {
  readonly policyId: string;
  /** Visible chunk radius in tiles. */
  visibleRadiusTiles: number;
  /** Resident (hidden) chunk radius in tiles. */
  residentRadiusTiles: number;
  /** Approximate GPU memory budget in bytes. */
  maxGpuBytes: number;
  /** Maximum draw calls per frame. */
  maxDrawCalls: number;
  /** Maximum visible entities (actors + objects + ground items). */
  maxVisibleEntities: number;
  /** Maximum visible instanced props. */
  maxVisibleProps: number;
  /** Maximum chunk GPU upload time per frame (ms). */
  maxUploadMsPerFrame: number;
  /** Maximum simultaneous worker bake jobs. */
  maxConcurrentBakeJobs: number;
  /** Frame-time target for adaptive scaling (ms). */
  targetFrameTimeMs: number;
  /** Whether to enable adaptive downscaling when p95 exceeds target. */
  adaptiveScalingEnabled: boolean;
}
```

### 4.4 Integration

- `ChunkResidencyManager` receives a `RenderBudgetPolicy` reference, not individual scalars.
- `ChunkBakeQueue` receives `maxConcurrentBakeJobs` from the same policy.
- `RenderPresentationSystem` receives `maxDrawCalls`, `maxVisibleEntities`, and `maxVisibleProps`.
- `ChunkUploadQueue` receives `maxUploadMsPerFrame`.
- A `BudgetPolicyRegistry` holds multiple policies (e.g., `ultra`, `high`, `medium`, `low`, `mobile`).
- The active policy can be swapped at runtime. `ChunkResidencyManager.evaluate()` re-evaluates all chunks immediately on policy change, so the new visible/resident radii apply within one frame.
- Adaptive scaling: a `FrameTimePolicyAdjuster` monitors `RenderClock` p95. If it exceeds `targetFrameTimeMs` for `N` consecutive seconds, it requests a downgrade to the next-lower policy. If frame time is healthy for `M` seconds, it requests an upgrade. This is advisory; the Game Owner persona (or explicit player setting) can lock the policy.

### 4.5 E35+ story size

- Adding a new tier: one new object literal in the registry.
- Adding adaptive scaling: one new system that reads metrics and calls `registry.setActivePolicy(id)`.
- Zero changes to `ChunkResidencyManager` internals.

## 5. Extension Point: Multi-Plane Support

### 5.1 Current state

`TileCoord`, `ChunkCoord`, `RegionCoord`, and `ChunkId` all include `plane: Plane` (0..3). `ChunkResidencyManager` stores `plane` in metadata and computes distances in `x`/`y` only. The renderer currently only renders `plane: 0`. There is no plane transition, no multi-plane culling, and no camera snap for vertical movement.

### 5.2 Future need

- Ladders, stairs, and rope swings move the player between planes.
- Dungeons exist on plane 1 or 2 with the same `x`/`y` as the surface.
- Rooftops on plane 1 must render the surface below at reduced fidelity.
- The camera must smoothly transition between planes or cut instantly depending on the context.

### 5.3 Extension: `PlaneManager` and `PlaneRenderStack`

```ts
export interface PlaneRenderConfig {
  readonly plane: Plane;
  /** Whether this plane is currently rendered. */
  readonly enabled: boolean;
  /** Render fidelity: 1.0 = full, 0.5 = half LOD, 0.0 = skip geometry. */
  readonly fidelity: number;
  /** Y-axis world offset for this plane. */
  readonly worldYOffset: number;
  /** Whether actors on this plane cast shadows onto lower planes. */
  readonly castShadows: boolean;
}

export interface PlaneTransition {
  readonly fromPlane: Plane;
  readonly toPlane: Plane;
  readonly type: "cut" | "fade" | "slide";
  readonly durationMs: number;
}
```

### 5.4 Integration

- `ChunkResidencyManager` is plane-aware but not plane-limited. It already tracks `plane` in `ChunkMetadata`. The change is to ensure `visibleRadiusTiles` and `residentRadiusTiles` are evaluated per-plane or across planes depending on policy.
- `PlaneManager` owns the active plane stack. It decides which planes are rendered based on player position, camera mode, and policy.
- `TerrainLayer` creates a `Group` per plane. Each plane's chunks are added to its own group. This avoids z-fighting between overlapping plane geometry.
- `InstanceBucket` keys already include `regionId` and `layer`. Plane is implicitly part of `regionId` (`${rx}:${ry}:${plane}`). No key change needed.
- Camera transitions: `CameraController` accepts a `PlaneTransition` request. It runs the transition using the render frame clock (not server tick). During a transition, the snapshot interpolation buffer continues to operate normally.
- Multi-plane visibility: when the player is on plane 1, plane 0 may still be visible at `fidelity: 0.5` with a reduced `visibleRadiusTiles`. The `RenderBudgetPolicy` can specify per-plane fidelity multipliers.

### 5.5 E35+ story size

- Adding a ladder: server sends a `PlaneTransition` intent; client runs the transition. `ChunkResidencyManager` already handles plane in metadata.
- Adding a dungeon: new region JSON on plane 1. `ChunkProvider` loads it. `PlaneManager` enables plane 1.
- Zero changes to `ChunkBakeQueue`, `ChunkBakeWorkerClient`, or `InstanceBucket`.

## 6. Extension Point: Async Material Loading

### 6.1 Current state

`RenderResourceRegistry` requires a `RenderMaterialFactory` at registration time. The factory is called synchronously on first `getMaterial()`. If the material needs a texture that is not yet loaded, the factory either blocks (bad) or returns a placeholder (unpredictable). There is no explicit loading state, retry, or fallback.

### 6.2 Future need

- Large content drops (e.g., a new region with 50 new textures) should not bloat the initial bundle.
- Mod/UGC materials may reference external textures that load from a CDN.
- Mobile clients may load lower-resolution texture variants based on the active budget policy.

### 6.3 Extension: `AsyncMaterialLoader` and `MaterialSlot`

```ts
export type MaterialLoadState = "unloaded" | "loading" | "ready" | "failed";

export interface MaterialSlot {
  readonly key: RenderResourceKey;
  readonly state: MaterialLoadState;
  /** The material to use while loading or if loading failed. */
  readonly fallback: Material;
  /** The final material, or null if not yet loaded. */
  readonly material: Material | null;
  /** Percentage 0..1 for progress-aware UI. */
  readonly loadProgress: number;
}

export interface AsyncMaterialLoader {
  /** Register a material that may load asynchronously. */
  registerAsync(key: RenderResourceKey, factory: () => Promise<Material>, fallback: Material): void;
  /** Request a material slot. The slot may be in any state. */
  request(key: RenderResourceKey): MaterialSlot;
  /** Preload a batch of materials before they are needed. */
  preload(keys: RenderResourceKey[]): void;
  /** Cancel loading for keys that are no longer needed. */
  cancel(keys: RenderResourceKey[]): void;
}
```

### 6.4 Integration

- `RenderResourceRegistry` keeps its synchronous path for built-in materials (`MeshLambertMaterial`, `MeshToonMaterial`, `MeshBasicMaterial`).
- A new `AsyncMaterialRegistry` wraps the synchronous registry for async materials. It lives in the same module boundary (`renderer/`) but is a separate object.
- `InstanceBucket` and scene layers use `MaterialSlot.fallback` when `state !== "ready"`. The fallback is a low-cost built-in material (e.g., vertex-colored `MeshLambertMaterial` with a flat grey color). This avoids runtime material churn and guarantees draw calls are stable.
- When the async material becomes ready, the registry notifies the bucket owner. The bucket can hot-swap the material reference, but this is a one-time event per material, not a per-frame operation. The swap is logged and counted as a budget event (not a frame spike).
- `ChunkBakeWorkerClient` worker payloads include `materialId` references. The worker does not create materials. The main thread maps `materialId` to a `MaterialSlot` before GPU upload. If the material is not ready, the chunk upload is deferred until it is, or the chunk uses a fallback material group.
- `ChunkUploadQueue` already has a `baked_waiting_gpu_upload` state. This state can also mean "waiting for material load."

### 6.5 E35+ story size

- Adding a CDN texture pack: register async factories, preload on region enter, cancel on region leave.
- Adding a mobile low-res variant: the factory loads a different texture URL based on the active `RenderBudgetPolicy`.
- Zero changes to `InstanceBucket` transform or flush logic.

## 7. Architecture Summary

The following diagram shows where the four extension points slot into the existing E34 render pipeline.

```
ClientPacketApplier
  │
  ├─► ChunkProviderRegistry.resolve(regionId)
  │       │
  │       ▼
  │   [StaticProvider] [EventProvider] [UGCProvider]
  │
  ▼
ChunkBakeQueue.ingestRegionLoad()
  │
  ├─► RenderBudgetPolicy (visibleRadius, maxGpuBytes, etc.)
  │
  ▼
ChunkResidencyManager.evaluate()
  │
  ├─► PlaneManager (active plane stack, fidelity per plane)
  │
  ▼
ChunkBakeWorkerClient.dequeueJob()
  │
  ▼
ChunkUploadQueue
  │
  ├─► AsyncMaterialRegistry.request(materialId)
  │       │
  │       ▼
  │   fallback ──► ready (one-time swap)
  │
  ▼
TerrainLayer / ObjectLayer / ActorLayer
  │
  ▼
RenderPresentationSystem
```

## 8. What changes in E34 vs E35+

E34 must **prepare the slots** without implementing the full features. Specifically:

| Extension point | E34 preparation (now) | E35+ implementation (later) |
|-----------------|-------------------------|-----------------------------|
| Pluggable chunk providers | Add `ChunkProvider` interface and `ChunkProviderRegistry`. Keep the current static provider as the default registration. | Write `EventProvider`, `DungeonProvider`, etc. |
| Configurable budget policies | Add `RenderBudgetPolicy` interface and `BudgetPolicyRegistry`. Move current hard-coded numbers into a default `medium` policy. | Write `mobile` policy, adaptive scaler, settings menu wiring. |
| Multi-plane support | Add `PlaneManager` skeleton. Ensure `ChunkResidencyManager` already uses `plane` from metadata. Ensure `regionId` includes `plane`. | Write camera transitions, per-plane fidelity, ladder/stair intent handling. |
| Async material loading | Add `AsyncMaterialLoader` interface. Keep all current materials synchronous/fallback-ready. | Write CDN factories, preload queues, mod texture loading. |

## 9. Trade-offs

### More code now

- Four new interfaces.
- Two new registries (`ChunkProviderRegistry`, `BudgetPolicyRegistry`).
- One new manager (`PlaneManager`).
- One new loader (`AsyncMaterialLoader`).
- Policy indirection in hot paths (budget lookups, provider resolution).

### Avoided rework later

- `ChunkResidencyManager` does not need a rewrite for events or dungeons.
- `ChunkBakeQueue` does not need a rewrite for instanced regions.
- `RenderResourceRegistry` does not need a rewrite for UGC textures.
- `InstanceBucket` does not need a rewrite for multi-plane.
- Hot loops remain allocation-free because the indirection is resolved once per frame and cached.

### Performance guardrails

- Provider resolution is cached per `regionId` per frame.
- Budget policy is read once per `evaluate()` call and cached in local variables.
- Plane manager state is read once per frame by the layer compositor.
- Material slot state is checked once per bucket at flush time, not per instance.

## 10. Validation

Before any E35+ epic is marked complete, the following must pass:

1. **Provider isolation:** A new provider can be registered and removed without touching `ChunkResidencyManager` or `ChunkBakeQueue`.
2. **Policy swap:** Changing the active policy at runtime reduces `visibleRadiusTiles` and chunks are hidden within one frame.
3. **Plane fidelity:** A chunk on plane 0 can remain resident while the player is on plane 1, and its fidelity multiplier is respected.
4. **Async fallback:** A material in `loading` state renders with its fallback material, and the draw call count is identical to the ready state.
5. **Zero hot-loop allocation:** All new extension-point lookups (provider, policy, plane, material slot) are cached or resolved outside the `requestAnimationFrame` hot loop.

Run:

```bash
bun run test
bun run render:boundaries
bun run typecheck
```

---

*Last updated: 2026-06-04*

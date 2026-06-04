# Asset Baking and Instancing Contract

> **Authority:** This document is the exact contract for render resources, instanced buckets, object pools, worker-baked terrain chunks, and GPU residency in the Old Town client. E32-E35 may not introduce new asset creation, upload, or disposal paths without amending this document.

## 1. Asset Classes

Every visible entity in the world is assigned to one of the following classes. Each class determines the render path, update frequency, and instancing policy.

| Class | Render path | Instancing | Update frequency | Example |
|-------|-------------|------------|------------------|---------|
| Terrain chunks | Worker-baked static mesh, uploaded once, visibility toggled | No (one mesh per chunk) | On region load / LOD change | Ground tile grid, elevation, water surface |
| Static props | `InstancedMesh` bucket keyed by `InstanceBucketKey` | Yes | Visibility only after placement | Rocks, fences, signs, lamp posts |
| Ground items | `InstancedMesh` bucket or atlas-backed billboard | Yes (billboard for small items) | Visibility only; matrix write on spawn/despawn | Dropped ore, fish, logs |
| Actors / NPCs | `InstancedMesh` bucket or single mesh per unique appearance | Yes (bucket by appearance) | Every frame: matrix write from interpolated transform | Players, NPCs, creatures |
| Hitsplats / projectiles | Pooled mesh or billboard instance, single-frame or short-lived | Yes (bucket by projectile type) | Every frame or lifetime-tick | Arrow arc, firebolt, damage number popup |
| Far decorations | Impostor, billboard, or low-LOD mesh; no collision | Atlas-backed billboard | Visibility only | Distant trees, roofs, mountain silhouettes |
| UI overlays | DOM or canvas overlay, never Three scene graph | N/A | Every frame (UI RAF loop) | Health bars, inventory, click markers, dialogue |

**Rule:** No class may create a new `Mesh`, `Geometry`, or `Material` inside the per-frame render loop. All creation must happen during load, bake, or prewarm phases.

## 2. Render Resource Key

Every renderable asset is addressed by a canonical `RenderResourceKey`.

```
RenderResourceKey {
  type:        'terrain' | 'prop' | 'actor' | 'projectile' | 'hitsplat' | 'groundItem' | 'farDeco' | 'ui'
  contentId:   string   // canonical content definition ID (e.g. 'prop:stone_wall', 'actor:guard')
  variant:     string?   // optional variant suffix for recolour, damage state, season, etc.
  materialId:  string?   // material override or skin ID; null means default from content registry
}
```

**Rule:** The content registry owns the mapping from `RenderResourceKey` to geometry metadata, material parameters, and texture references. The render system never guesses these values.

## 3. Instance Bucket Key

Instanced geometry is grouped into `InstanceBucket`s. Each bucket is addressed by exactly the following key.

```
InstanceBucketKey {
  archetypeId:  string   // content ID or appearance hash that defines the mesh geometry
  materialId:   string   // material instance ID (may be 'default' or a specific skin)
  regionId:     string   // spatial region or chunk ID that owns the bucket
  layer:        string   // scene layer name: 'terrain', 'props', 'actors', 'projectiles', 'hitsplats', 'groundItems', 'farDeco'
}
```

**Rule:** Two entities with the same `InstanceBucketKey` share the same `InstancedMesh`. Entities with different keys must not be merged into the same mesh. This is the grouping contract for E33.

## 4. Instance Bucket State and Operations

An `InstanceBucket` owns one `THREE.InstancedMesh` and manages slot assignment for entities.

### 4.1 Required State

| Field | Type | Meaning |
|-------|------|---------|
| `mesh` | `THREE.InstancedMesh` | The Three mesh instance. |
| `capacity` | `number` | Maximum instances allocated in the mesh. |
| `activeCount` | `number` | Number of currently used slots. |
| `freeList` | `number[]` | Stack of released slot indices available for reuse. |
| `entityIdToSlot` | `Map<number, number>` | Maps entity ID to assigned slot index. |
| `slotToEntityId` | `Map<number, number>` | Inverse map: slot index to entity ID. |
| `instanceMatrixArray` | `Float32Array` | Flat buffer backing `mesh.instanceMatrix`. |
| `instanceColorOrSeedArray` | `Float32Array?` | Optional flat buffer for per-instance colour or random seed. |
| `dirtyStart` | `number` | Lowest array index that changed since last flush. |
| `dirtyEnd` | `number` | Highest array index that changed since last flush (exclusive). |
| `boundsDirty` | `boolean` | True if the bucket's bounding sphere needs recomputation. |
| `lastFlushFrame` | `number` | Frame number of the most recent flush. |

### 4.2 Operations

| Operation | Behaviour |
|-----------|-----------|
| `acquire(entityId)` | If `freeList` is non-empty, pop a slot and assign it. Otherwise, if `activeCount < capacity`, append at `activeCount` and increment. Otherwise, return `null` (bucket full). Writes `entityIdToSlot` and `slotToEntityId`. |
| `release(entityId)` | Look up the slot, clear the matrix to identity (or zero scale), add the slot to `freeList`, delete both maps. If the slot was the highest active index, reduce `activeCount` to the next highest occupied slot plus one. Mark bounds dirty. |
| `writeTransform(entityId, matrix)` | Look up the slot, write the 16 floats into `instanceMatrixArray` at the slot offset, update `dirtyStart` and `dirtyEnd`. |
| `writeColorOrSeed(entityId, rgbaOrSeed)` | If `instanceColorOrSeedArray` exists, look up the slot, write the 4 floats, update dirty range. |
| `markDirty(start, end)` | Expand `dirtyStart` and `dirtyEnd` to cover the given range. |
| `flush(frameNumber)` | If `dirtyStart < dirtyEnd`, call `mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)` before first use, then upload the subrange via `mesh.instanceMatrix.needsUpdate = true`. If `instanceColorOrSeedArray` exists, do the same for the colour attribute. Reset `dirtyStart` to `capacity`, `dirtyEnd` to `0`. Set `lastFlushFrame = frameNumber`. |
| `recomputeBoundsIfNeeded()` | If `boundsDirty` is true, iterate all active slots, compute a bounding sphere, assign to `mesh.boundingSphere`, and clear the flag. |
| `dispose()` | Dispose the `InstancedMesh` geometry and material only if the bucket owns them (not shared). Clear all arrays and maps. |

**Ban:** `mesh.count` must never be set to a value that includes free-list holes in the middle of the active range. The render system must tolerate holes or compact them. The policy for E33 is defined in Section 5.

## 5. Free-List Holes and Compaction Policy

`InstanceBucket` uses a free-list with holes.

- `mesh.count` is set to `highestActiveSlot + 1` after every `acquire` or `release` that changes the highest active index.
- Released slots are pushed onto `freeList` and left as zero-scale identity matrices until reused.
- This means the GPU may iterate over inactive slots at the end of the range, but never over holes in the middle.

**Compaction:**
- Compaction is deferred to non-combat idle frames only.
- During compaction, active slots are moved leftward to fill holes, matrices and colours are rewritten, maps are updated, and `mesh.count` is set to `activeCount`.
- Compaction is cancelled if the player enters combat before it finishes.
- Compaction is never required for correctness; it is a performance optimisation.

**Rule:** The render loop must function correctly whether or not compaction has run. No gameplay system may depend on slot indices being contiguous.

## 6. Render Object Pool

Short-lived render objects (projectiles, hitsplats, temporary particles) are drawn from a typed `RenderObjectPool<T>` rather than created with `new` in the hot path.

### 6.1 Operations

| Operation | Behaviour |
|-----------|-----------|
| `prewarm(count)` | Allocates `count` objects upfront, marks them all free, and sets `capacity = count`. |
| `acquire()` | Returns the first free object, or `null` if the pool is exhausted. Marks it active. |
| `release(obj)` | Returns the object to the free list. Clears all mutable fields to a safe default. |
| `reset()` | Marks every object as free and clears all mutable fields. Preserves capacity. |
| `dispose()` | Clears the internal array and frees references so GC can collect. |
| `activeCount` | Read-only property returning the number of currently active objects. |

**Rule:** The hot path must never allocate new pool objects. If a pool is exhausted, the render system drops the draw call (e.g., skips the projectile) rather than growing the pool.

## 7. Chunk Bake Queue

Terrain chunks move through a strict lifecycle state machine.

| State | Meaning | Allowed transitions |
|-------|---------|---------------------|
| `unseen` | The chunk has never been requested. | `metadata_loaded` |
| `metadata_loaded` | Chunk metadata (tile types, bounds) is resident; no mesh exists yet. | `bake_requested` |
| `bake_requested` | The main thread has queued a bake request to the worker. | `baking_worker` |
| `baking_worker` | The worker is currently generating geometry. | `baked_waiting_gpu_upload`, `unseen` (cancellation) |
| `baked_waiting_gpu_upload` | The worker returned baked buffers; the main thread has not yet uploaded them to GPU. | `gpu_resident` |
| `gpu_resident` | Buffers are on the GPU; mesh exists but is not in the visible scene. | `visible`, `hidden_resident`, `evict_pending` |
| `visible` | The mesh is in the scene graph and being rendered. | `hidden_resident`, `evict_pending` |
| `hidden_resident` | The mesh is off-screen or occluded; it remains GPU-resident for fast re-show. | `visible`, `evict_pending` |
| `evict_pending` | The mesh is queued for GPU eviction (e.g., LRU, distance, memory pressure). | `disposed`, `gpu_resident` (if re-shown before eviction) |
| `disposed` | The mesh and GPU buffers are destroyed. | `unseen` (if the region is revisited) |

**Rule:** Only the `TerrainLayer` system may transition chunk states. No other module may call `dispose` on a chunk mesh.

## 8. Worker Message Types

The chunk bake worker communicates with the main thread via `postMessage`. All payloads use transferable `ArrayBuffer`s.

| Message | Direction | Payload | Transfers |
|---------|-----------|---------|-----------|
| `BAKE_REQUEST` | Main → Worker | `{ chunkId, tileData, seed, lod }` | None (tileData is a structured clone of metadata). |
| `BAKE_SUCCESS` | Worker → Main | `{ chunkId, payload: BakedChunkPayload }` | All `ArrayBuffer`s inside the payload. |
| `BAKE_FAILURE` | Worker → Main | `{ chunkId, errorCode, reason }` | None. |
| `CANCELLATION` | Main → Worker | `{ chunkId }` | None. Worker must abort early if possible. |

**Rule:** `SharedArrayBuffer` is Phase 2 only. Phase 1 uses `postMessage` with transferable buffers. No production code may depend on `SharedArrayBuffer`.

**Rule:** OffscreenCanvas renderer movement is Phase 3 only. No worker may create a Three renderer or call `requestAnimationFrame`.

## 9. Baked Chunk Payload

The result of a successful chunk bake is a `BakedChunkPayload`.

```
BakedChunkPayload {
  positions:           Float32Array   // vertex positions (x, y, z)
  normals:             Float32Array?  // vertex normals; null if flat-shaded
  colors:              Float32Array?  // per-vertex colour (RGBA); null if material-coloured
  indices:             Uint16Array | Uint32Array
  materialGroups:      MaterialGroup[]
  bounds:              { min: {x,y,z}, max: {x,y,z} }
  tileMetadata:        TileMetadata[]  // sparse tile data for raycast / collision debug
  collisionDebugOverlay: Float32Array?  // debug-only line geometry for tile collision
  transferableBuffers:   ArrayBuffer[]    // list of every ArrayBuffer that must be transferred
}
```

```
MaterialGroup {
  materialId:   string
  startIndex:   number
  count:        number
}
```

```
TileMetadata {
  tileX:        number
  tileY:        number
  tileZ:        number
  groundType:   string
  walkable:     boolean
  collisionFlags: number
}
```

**Rule:** The worker must populate `transferableBuffers` with every `ArrayBuffer` backing the typed arrays. The main thread must transfer these, not clone them, to avoid duplication.

## 10. GPU Upload Budget

The main thread enforces a strict per-frame GPU upload budget.

- **POC default:** max `2 ms` of CPU time per frame spent uploading chunk geometry.
- **POC default:** max one chunk upload per frame.
- **Exception:** If the measured frame time is below the target budget (e.g., 16 ms at 60 Hz), an additional upload is permitted, but the total upload time must still not exceed `2 ms`.

**Rule:** Uploads are ordered by distance from the camera (nearest first). Distant chunks may wait multiple frames.

## 11. Combat Upload Ban

No texture upload, material creation, shader compilation, or large geometry allocation may occur during combat if it could have been queued earlier.

- **Definition of combat:** The player has a valid target, is in an active combat session, or has received a combat event in the last `3` seconds.
- **Allowed:** Updating existing instance matrices, visibility toggles, and small uniform changes.
- **Banned:** Uploading new chunk geometry, creating new `Texture`, `Material`, or `ShaderMaterial`, compiling shaders, or allocating buffers larger than `1 KB`.

**Rule:** The `TerrainLayer` pre-bakes and pre-uploads chunks for the current region before combat starts. The render system may not use "lazy upload" as an excuse to stall the frame during combat.

## 12. Material Standards

The default material path for all gameplay geometry is a built-in Three.js material.

| Use case | Permitted material |
|----------|--------------------|
| Terrain, props, ground items | `MeshLambertMaterial` or `MeshToonMaterial` |
| Actors, NPCs, creatures | `MeshToonMaterial` or `MeshLambertMaterial` |
| Projectiles, hitsplats | `MeshBasicMaterial` or `MeshToonMaterial` |
| Far decorations | `MeshBasicMaterial` or sprite atlas material |
| UI overlays | DOM / canvas, not Three |

**Ban:** Custom `ShaderMaterial` with `lights: true` is banned for default gameplay geometry. No shader deformation, custom lighting models, or full-screen post-processing may be introduced without a future ADR and E35 evidence.

**Allowed:** `onBeforeCompile` patches to built-in materials are permitted for minor optimisations (e.g., fog injection, instanced colour shader chunk), provided the patch is registered in a central material registry and is documented.

**Allowed:** Registry-owned built-in materials (e.g., a shared `MeshToonMaterial` instance per content skin) are the preferred path. Material instances must be created at load time, not per frame.

## 13. Deferred Backends

The following technologies remain explicitly non-production until E35 metrics prove need and a future ADR is created:

- `SharedArrayBuffer` for main-thread / worker render state sharing
- OffscreenCanvas renderer movement (rendering in a Worker)
- WebGPU migration

They may be prototyped in feature branches, but no production code in `master` may depend on them.

---

*Last updated: 2026-06-04*

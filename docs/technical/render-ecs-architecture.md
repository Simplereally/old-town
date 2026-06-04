# Render ECS Architecture Decision

> **Authority:** This document is the single source of truth for which modules own simulation, render, and presentation state in the Old Town client. E32-E35 may not introduce new render mutation sites without amending this document.

## 1. Authority Boundaries

| Concern | Owner | Rule |
|--------|-------|------|
| Gameplay state | Server | The server is the only authoritative simulation. Every tick is the canonical truth. |
| Tile positions | Server | All gameplay coordinates are integer tile positions. Fractional positions do not exist in the simulation protocol. |
| Tick cadence | Server | The server runs on a 600 ms tick. Client render must not assume a different tick rate or derive timing from packet arrival. |
| Float positions | Client render | Only render modules may convert integer tile positions into float world-space positions for interpolation, camera framing, and display. |
| Packet arrival time | Not simulation time | The moment a packet arrives at the client is not a simulation event. Network callbacks are not render systems. |

The client is a dumb frame-interpolating viewer of server snapshots. It may predict input for local responsiveness, but it must not authoritatively resolve collisions, drops, XP, or damage.

## 2. Client Module Ownership

| Module | Responsibilities | What it may NOT touch |
|--------|------------------|-----------------------|
| `GameSocket` | Connect, handshake, keepalive, binary frame parsing, packet routing, backpressure signaling | Three objects, scene graph, camera, DOM outside its own status UI |
| `ClientPacketApplier` (or successor) | Decode packets, validate, order, reduce into pure client state structs, write to `ClientWorldStore` | `Object3D`, `Mesh`, `Group`, geometry buffers, materials, renderer state, camera state |
| `ClientWorldStore` | Hold the last authoritative snapshot, dirty flags, entity ID maps, content ID references | Float positions, transforms, Three references, handles |
| `SnapshotBuffer` | Store historical snapshots, provide interpolation samples, evict by age/count | Three objects, allocation per sample |
| `RenderClock` | Track `requestAnimationFrame` delta, clamp, predict next frame time, expose `alpha` for interpolation | Server tick logic, packet timestamps as simulation time |
| `RenderTransformCache` | Map entity IDs to float position/rotation/scale, interpolate between two snapshots, write to typed arrays | Three scene graph, mesh instances, materials |
| `RenderPresentationSystem` | Read `RenderTransformCache`, drive bucket instances, update `InstancedMesh` matrices, set visibility, issue draw calls | Gameplay state mutation, packet decode, network sends |
| Scene layers (`TerrainLayer`, `ActorLayer`, `ObjectLayer`, `ProjectileLayer`, `HitsplatLayer`, `GroundItemLayer`) | Own a specific `InstancedMesh` bucket or `Group`, update matrices and visibility for their entity kind | Other layers' buckets, gameplay state, UI state |
| UI state | React/Vue stores, health bars, inventory, dialogue, menus, crafting panels | Three scene graph, camera, renderer size |
| Debug overlays | FPS, frame time, packet histogram, draw calls, bucket fill | Nothing in production; toggled off by default |

## 3. Forbidden Imports and Mutations

`three` and any direct Three.js type imports (`Object3D`, `Mesh`, `Group`, `Geometry`, `Material`, `Scene`, `Camera`, `WebGLRenderer`, etc.) are forbidden outside the following exact locations:

1. `apps/client/src/game/renderer/**`
2. `apps/client/src/game/scene/**`
3. Client test and support files that explicitly test render modules

Any other module that needs to refer to a render entity must use a **render handle** (see next section) or an entity ID. No gameplay, network, or UI module may:

- Call `new Mesh`, `new Group`, `new Geometry`, or `new Material`.
- Mutate `position`, `rotation`, `scale`, `visible`, `matrix`, or `matrixWorld` on any Three object.
- Resize the renderer, change the camera, or add/remove objects from the scene graph.
- Attach user data, callbacks, or gameplay state to Three objects.

## 4. Render Handle

Every render entity is addressed by a handle, not a raw Three object reference, at boundaries outside render modules.

```
RenderHandle {
  kind:       'actor' | 'object' | 'projectile' | 'hitsplat' | 'groundItem' | 'terrain'
  bucketId:   number   // which InstancedMesh bucket or group registry
  slotIndex:  number   // index inside that bucket
  resourceKey: string   // canonical content ID (e.g. 'actor:guard', 'projectile:arrow_iron')
  debugName:  string?   // optional human-readable label for debugging
}
```

Gameplay stores and client world stores hold entity IDs and content IDs. They never hold `RenderHandle` values directly. The `RenderPresentationSystem` owns the mapping from entity ID to `RenderHandle` and is the only system that may resolve a handle to a Three resource.

## 5. Hot Path Allocation Standard

The following loops must not perform app-level allocations (no `new`, no object literals, no array growth, no closure creation, no string concatenation) after initial warmup:

- `onFrame` / `requestAnimationFrame` callback
- Snapshot sampling (reading two snapshots to produce interpolation inputs)
- Bucket flush (clearing/recycling instances before new frame write)
- Projectile update loop
- Hitsplat update loop (position, lifetime, fade)
- Actor transform update loop
- Picking target refresh loop
- Chunk visibility update loop

Pre-allocated typed arrays, fixed-size ring buffers, object pools, and `Float32Array` subarray views are the permitted tools. If a loop needs a temporary vector, it must be drawn from a per-thread or per-frame pool and returned immediately.

## 6. Current Code Refactor Targets

The following modules violate or will be changed by later E32-E35 epics. They are explicitly named so future stories know where to cut:

- `GameEngine` — currently owns both network decode and scene mutation; must split.
- `ClientPacketApplier` — currently mutates Three objects directly in network callbacks; must reduce to pure state writes.
- `ActorRenderer` — contains per-actor mesh creation and direct `Object3D` mutation; must become a bucket-driven instance writer.
- `ObjectRenderer` — same pattern as `ActorRenderer`.
- `TerrainLayer` — may rebuild geometry on chunk change; must move to static baked tiles and visibility-only updates.
- `ProjectileLayer` — currently creates temporary meshes per projectile; must use pooled projectile bucket.
- `HitsplatLayer` — currently creates DOM or sprite elements per hitsplat; must use instanced billboard bucket or a pooled mesh system.
- `GroundItemLayer` — currently creates item meshes ad hoc; must use instanced item bucket keyed by content ID.
- `MeshPool` — currently an ad hoc pool with unclear ownership; must become a registry under `RenderPresentationSystem` with explicit handle semantics.

## 7. Deferred Backends

The following technologies are explicitly non-production until E35 metrics prove need and a future ADR is created:

- `SharedArrayBuffer` for main-thread / worker thread render state sharing
- OffscreenCanvas renderer movement (rendering in a Worker)
- WebGPU migration

They may be prototyped in feature branches, but no production code in `master` may depend on them, and no architecture decision in this document assumes they exist.

## 8. Validation

Run the automated boundary checks to confirm no gameplay or network module has introduced a forbidden Three.js import or mutation:

```bash
bun run render:boundaries
```

This script must pass before any PR that touches `apps/client/src/game/`, `apps/server/`, or `packages/shared/` is merged.

---

*Last updated: 2026-06-04*

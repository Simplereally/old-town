# E31-S01 - Render ECS Architecture Decision

## Epic

E31 - Render Architecture Contracts

## Dependency chain

- Depends on: E30
- Blocks: E31-S02, E31-S03, E31-S04, E32

## Spec references

- ENGINE_AND_RENDERING.md
- tasks/ENGINE_AND_RENDERING_TASK_GRAPH.md
- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §8.4
- POC_SPEC.md §23
- POC_SPEC.md §25.2

## Objective

Create `docs/technical/render-ecs-architecture.md`, the authoritative architecture decision for separating server/client gameplay truth, client render cache, Three.js resources, and frame-time presentation.

## Required architectural decisions

- The server remains the only authoritative gameplay simulation.
- `packages/shared` remains pure protocol/types/math/content-schema code and must not import `three`.
- `apps/server` remains pure gameplay/network/persistence code and must not import `three`.
- Client network modules may decode, validate, order, and reduce packets into pure client state, but may not mutate `Object3D`, `Mesh`, `Group`, geometry buffers, materials, renderer state, or camera state.
- Client render systems are the only modules allowed to write Three transforms, instance matrices, material uniforms, renderer size, camera transforms, or scene graph membership.
- Render state uses handles, not raw Three object references, at boundaries outside render modules.
- Hot render state may use struct-of-arrays typed arrays for entity transforms and bucket slots, but the design must reject one giant monolithic float stride for all ECS state.
- Three resources are allocated through render registries, instance buckets, object pools, or explicit load/upload queues. Ad hoc `new Mesh`, `new Group`, `new Geometry`, or `new Material` calls are banned from network callbacks and per-frame hot loops.

## Implementation checklist

- [X] Create `docs/technical/` if it does not exist.
- [X] Create `docs/technical/render-ecs-architecture.md`.
- [X] Add an "Authority Boundaries" section that explicitly states server truth, integer tile truth, 600ms tick semantics, and render-only float positions.
- [X] Add a "Client Module Ownership" table with rows for `GameSocket`, `ClientPacketApplier` or its replacement, `ClientWorldStore`, `SnapshotBuffer`, `RenderClock`, `RenderTransformCache`, `RenderPresentationSystem`, scene layers, UI state, and debug overlays.
- [X] Add a "Forbidden Imports and Mutations" section listing exactly where `three` imports are allowed: `apps/client/src/game/renderer/**`, `apps/client/src/game/scene/**`, and client test/support files that explicitly test render modules.
- [X] Add a "Render Handle" section defining a handle shape with `kind`, `bucketId`, `slotIndex`, `resourceKey`, and optional `debugName`; state that gameplay stores IDs and content IDs, not handles.
- [X] Add a "Hot Path Allocation Standard" section requiring no app-level allocations in `onFrame`, snapshot sampling, bucket flush, projectile update, hitsplat update, actor transform update, picking target refresh, or chunk visibility update loops.
- [X] Add a "Current Code Refactor Targets" section naming current modules that violate or will be changed by later epics: `GameEngine`, `ClientPacketApplier`, `ActorRenderer`, `ObjectRenderer`, `TerrainLayer`, `ProjectileLayer`, `HitsplatLayer`, `GroundItemLayer`, and `MeshPool`.
- [X] Add a "Deferred Backends" section stating that `SharedArrayBuffer`, OffscreenCanvas renderer movement, and WebGPU are non-production until E35 metrics prove need and a future ADR is created.
- [X] Update `docs/00-index.md` with a link to `docs/technical/render-ecs-architecture.md`.

## Acceptance criteria

- [X] `docs/technical/render-ecs-architecture.md` exists and contains every section listed above.
- [X] The document gives exact allowed/disallowed module ownership, not general advice.
- [X] The document explicitly states that packet arrival time is not simulation time and network callbacks are not render systems.
- [X] The document names concrete repo modules that later stories must refactor.
- [X] The document contains no requirement to implement `SharedArrayBuffer`, OffscreenCanvas renderer movement, WebGPU, or broad shader deformation.
- [X] `docs/00-index.md` links to the new document.

## Validation commands

- [X] `bun run lint`
- [X] `bun run typecheck`
- [X] `bun run tasks:status`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E31/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

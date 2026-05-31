# E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E32
- Unlocks: E34

## Spec references

- ENGINE_AND_RENDERING.md (Phase B)
- tasks/ENGINE_AND_RENDERING_TASK_GRAPH.md
- docs/technical/render-ecs-architecture.md
- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §6
- POC_SPEC.md §7.2, §7.3
- POC_SPEC.md §23
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js BufferAttribute: https://threejs.org/docs/pages/BufferAttribute.html
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Epic goal

Move repeated renderable resources behind registries, instance buckets, and pools. Static objects, repeated props, ground items, markers, projectiles, hitsplats, and actor visuals must stop creating or mutating unmanaged Three objects from gameplay-facing code paths.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E33/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E33-S01` - [Render Resource Registry](stories/E33/E33-S01_render-resource-registry.md)
- [ ] `E33-S02` - [Instance Bucket Core](stories/E33/E33-S02_instance-bucket-core.md)
- [ ] `E33-S03` - [Static Object Instancing](stories/E33/E33-S03_static-object-instancing.md)
- [ ] `E33-S04` - [Transient Effect Pools](stories/E33/E33-S04_transient-effect-pools.md)
- [ ] `E33-S05` - [Actor Presentation Pool](stories/E33/E33-S05_actor-presentation-pool.md)
- [ ] `E33-S06` - [Render Mutation Boundary Enforcement](stories/E33/E33-S06_render-mutation-boundary-enforcement.md)

## Epic acceptance criteria

- [ ] Repeated object/prop/ground-item rendering uses bucket keys of `archetypeId + materialId + regionId + layer`.
- [ ] Instance bucket writes are batched and flushed once per frame per bucket.
- [ ] `mesh.count`, slot maps, free lists, dirty ranges, and bounds recomputation are handled deterministically.
- [ ] Projectiles, hitsplats, click markers, hover markers, and decals use reusable pools or buckets with no per-frame allocations in hot update paths.
- [ ] Actor visuals are render handles backed by pooled resources; gameplay/client store state does not hold Three objects.
- [ ] Boundary checks fail if `apps/server`, `packages/shared`, or client net/store modules import Three or mutate `Object3D` transforms.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

# E33-S03 - Static Object Instancing

## Epic

E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E33-S02
- Blocks: E33-S04, E33-S05, E33-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §6
- POC_SPEC.md §7.2
- POC_SPEC.md §7.3

## Objective

Refactor static object rendering from one mesh per object into chunk/region-local `InstanceBucket`s keyed by object archetype, material, region, and render layer.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/scene/ObjectRenderer.instancing.test.ts`.
- [ ] Update `ObjectRenderer` to request object geometry/material resources through `RenderResourceRegistry`.
- [ ] Replace per-object `Mesh` creation with bucket slot acquisition.
- [ ] Define object `archetypeId` from content def id through the existing visual archetype resolver.
- [ ] Compute bucket key as `archetypeId + materialId + regionId + layer`.
- [ ] Preserve object entity id to raycast/picking identity through slot metadata.
- [ ] Preserve object transform/morph updates by moving an entity between buckets when its def/archetype changes.
- [ ] Add chunk or region culling hooks so whole buckets can be hidden/resident without destroying every slot.
- [ ] Flush changed buckets once per render frame, not inside `spawn`, `remove`, or `transform`.
- [ ] Preserve existing `objectCount`, `clear`, `dispose`, and raycast target behavior where external callers depend on it.

## Acceptance criteria

- [ ] Spawning 100 objects of the same archetype/material/region creates one instanced bucket, not 100 meshes.
- [ ] Removing an object releases its slot and does not leak raycast metadata.
- [ ] Transforming an object to a different archetype releases the old slot and acquires the correct new bucket slot.
- [ ] Bucket flush happens from render-frame code, not packet ingestion.
- [ ] Existing picking/context-menu behavior still identifies object entity ids and def ids.
- [ ] Tests cover spawn, remove, transform, clear, dispose, and raycast metadata.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/scene/ObjectRenderer.instancing.test.ts`
- [ ] `bun run test -- apps/client/src/game/scene/ObjectRenderer.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

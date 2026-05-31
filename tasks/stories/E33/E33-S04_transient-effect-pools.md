# E33-S04 - Transient Effect Pools

## Epic

E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E33-S03
- Blocks: E33-S05, E33-S06

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §7.3

## Objective

Replace ad hoc transient mesh allocation with reusable pools or instanced buckets for projectiles, hitsplats, click markers, hover markers, ground markers, and decals.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/RenderObjectPool.test.ts`.
- [ ] Create `apps/client/src/game/renderer/RenderObjectPool.ts`.
- [ ] Implement `RenderObjectPool<T>` with `prewarm`, `acquire`, `release`, `reset`, `activeCount`, `poolSize`, and `dispose`.
- [ ] Refactor `MeshPool` or replace it with `RenderObjectPool<Mesh>` so pooled meshes share registry-owned geometry/material where safe and do not clone resources unnecessarily.
- [ ] Update `ProjectileLayer` to acquire from a pool or instanced bucket and to use E32 server-tick timing.
- [ ] Update `HitsplatLayer` to acquire from pools or instanced quads and to use E32 server-time lifetime.
- [ ] Update click markers and hover markers to reuse resources rather than creating/discarding geometry/material on every click or hover.
- [ ] Update `GroundItemLayer` to use instancing or atlas/quad buckets for repeated item visuals where compatible with picking.
- [ ] Add stats for active projectiles, hitsplats, markers, and pool sizes.
- [ ] Add tests proving repeated spawn/remove cycles do not increase pool size beyond configured growth limits.

## Acceptance criteria

- [ ] No click marker creates new geometry/material per click after prewarm.
- [ ] Projectile and hitsplat update loops do not allocate per active effect.
- [ ] Ground item rendering uses a repeated-resource path and preserves item entity picking.
- [ ] Pool disposal frees resources once and clears active objects.
- [ ] Stress-style tests can spawn/remove at least 1000 transient effects without unbounded pool growth.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/RenderObjectPool.test.ts`
- [ ] `bun run test -- apps/client/src/game/scene/ProjectileLayer.test.ts`
- [ ] `bun run test -- apps/client/src/game/scene/HitsplatLayer.test.ts`
- [ ] `bun run test -- apps/client/src/game/scene/GroundItemLayer.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

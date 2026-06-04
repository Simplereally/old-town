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

- [X] Write failing tests in `apps/client/src/game/renderer/RenderObjectPool.test.ts`.
- [X] Create `apps/client/src/game/renderer/RenderObjectPool.ts`.
- [X] Implement `RenderObjectPool<T>` with `prewarm`, `acquire`, `release`, `reset`, `activeCount`, `poolSize`, and `dispose`.
- [X] Refactor `MeshPool` or replace it with `RenderObjectPool<Mesh>` so pooled meshes share registry-owned geometry/material where safe and do not clone resources unnecessarily.
- [X] Update `ProjectileLayer` to acquire from a pool or instanced bucket and to use E32 server-tick timing.
- [X] Update `HitsplatLayer` to acquire from pools or instanced quads and to use E32 server-time lifetime.
- [X] Update click markers and hover markers to reuse resources rather than creating/discarding geometry/material on every click or hover.
- [X] Update `GroundItemLayer` to use instancing or atlas/quad buckets for repeated item visuals where compatible with picking.
- [X] Add stats for active projectiles, hitsplats, markers, and pool sizes.
- [X] Add tests proving repeated spawn/remove cycles do not increase pool size beyond configured growth limits.

## Acceptance criteria

- [X] No click marker creates new geometry/material per click after prewarm.
- [X] Projectile and hitsplat update loops do not allocate per active effect.
- [X] Ground item rendering uses a repeated-resource path and preserves item entity picking.
- [X] Pool disposal frees resources once and clears active objects.
- [X] Stress-style tests can spawn/remove at least 1000 transient effects without unbounded pool growth.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/RenderObjectPool.test.ts`
- [X] `bun run test -- apps/client/src/game/scene/ProjectileLayer.test.ts`
- [X] `bun run test -- apps/client/src/game/scene/HitsplatLayer.test.ts`
- [X] `bun run test -- apps/client/src/game/scene/GroundItemLayer.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck` (pre-existing errors only; no new errors introduced)
- [ ] `bun run lint` (no lint script in client package)

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

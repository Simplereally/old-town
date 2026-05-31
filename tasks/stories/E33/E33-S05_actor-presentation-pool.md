# E33-S05 - Actor Presentation Pool

## Epic

E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E33-S04
- Blocks: E33-S06

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §7.3
- POC_SPEC.md §7.4
- Three.js AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html

## Objective

Refactor actor rendering so players and NPCs use pooled presentation objects, registry-owned resources, and render handles driven by `RenderTransformCache`.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/scene/ActorRenderer.pooling.test.ts`.
- [ ] Define `ActorRenderHandle` with `entityId`, `kind`, `resourceKey`, `poolSlot`, and optional `bucketId`.
- [ ] Replace actor `serverTile` mutation from packet updates with presentation data supplied from `RenderTransformCache`.
- [ ] Keep actor authoritative tile data in pure client state; `ActorRenderer` only receives presentation transforms and metadata.
- [ ] Pool humanoid groups and creature body meshes by archetype.
- [ ] Reuse registry-owned geometries and materials for actor parts.
- [ ] Define an animation sampling policy with tick-quantized states: idle, walk, run, attack, cast, hit, die; default quantization is four visual substeps per 600ms server tick.
- [ ] Use CPU-side quantized animation first; do not add shader skinning or broad shader deformation.
- [ ] Preserve local-player marker behavior as a pooled render child or marker bucket.
- [ ] Preserve health bar, name, appearance, and facing updates through render metadata updates.
- [ ] Add tests for spawn, remove, appearance update, facing update, health bar update, transform-cache-driven position update, and pool reuse.

## Acceptance criteria

- [ ] Actor renderer no longer owns authoritative `serverTile` truth.
- [ ] Actor visual positions are applied from `RenderTransformCache` samples.
- [ ] Spawning/removing the same actor archetype reuses pooled render objects.
- [ ] Equipment/appearance updates still change visible presentation.
- [ ] Animation events are visual-only and cannot drive gameplay.
- [ ] Quantized actor animations sample at four visual substeps per server tick unless E35 metrics or content docs justify a different value.
- [ ] No shader skinning or GPU procedural deformation is introduced as the default actor path.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/scene/ActorRenderer.pooling.test.ts`
- [ ] `bun run test -- apps/client/src/game/scene/ActorRenderer.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

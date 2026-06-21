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

- [X] Write failing tests in `apps/client/src/game/scene/ActorRenderer.pooling.test.ts`.
- [X] Define `ActorRenderHandle` with `entityId`, `kind`, `resourceKey`, `poolSlot`, and optional `bucketId`.
- [X] Replace actor `serverTile` mutation from packet updates with presentation data supplied from `RenderTransformCache`.
- [X] Keep actor authoritative tile data in pure client state; `ActorRenderer` only receives presentation transforms and metadata.
- [X] Pool humanoid groups and creature body meshes by archetype.
- [X] Reuse registry-owned geometries and materials for actor parts.
- [X] Define an animation sampling policy with tick-quantized states: idle, walk, run, attack, cast, hit, die; default quantization is four visual substeps per 600ms server tick.
- [X] Use CPU-side quantized animation first; do not add shader skinning or broad shader deformation.
- [X] Preserve local-player marker behavior as a pooled render child or marker bucket.
- [X] Preserve health bar, name, appearance, and facing updates through render metadata updates.
- [X] Add tests for spawn, remove, appearance update, facing update, health bar update, transform-cache-driven position update, and pool reuse.

## Acceptance criteria

- [X] Actor renderer no longer owns authoritative `serverTile` truth.
- [X] Actor visual positions are applied from `RenderTransformCache` samples.
- [X] Spawning/removing the same actor archetype reuses pooled render objects.
- [X] Equipment/appearance updates still change visible presentation.
- [X] Animation events are visual-only and cannot drive gameplay.
- [X] Quantized actor animations sample at four visual substeps per server tick unless E35 metrics or content docs justify a different value.
- [X] No shader skinning or GPU procedural deformation is introduced as the default actor path.

## Validation commands

- [X] `bun run test -- apps/client/src/game/scene/ActorRenderer.pooling.test.ts`
- [X] `bun run test -- apps/client/src/game/scene/ActorRenderer.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

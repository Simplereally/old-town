# E33-S01 - Render Resource Registry

## Epic

E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E32-S06
- Blocks: E33-S02, E33-S03, E33-S04, E33-S05, E33-S06

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/asset-baking-and-instancing.md
- POC_SPEC.md §7.3
- POC_SPEC.md §23

## Objective

Implement a render-only resource registry for reusable geometries, materials, textures, archetype keys, and disposal. This registry becomes the only normal path for shared render resource creation.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/RenderResourceRegistry.test.ts`.
- [ ] Create `apps/client/src/game/renderer/RenderResourceRegistry.ts`.
- [ ] Export `RenderResourceKey`, `RenderResourceRegistry`, `RenderGeometryFactory`, `RenderMaterialFactory`, and `RenderResourceStats`.
- [ ] Implement key normalization for `type`, `contentId`, `variant`, and `materialId` so equivalent keys reuse resources.
- [ ] Move low-poly object geometry/material template creation behind the registry without changing the visual output.
- [ ] Move actor shared base geometry/material creation behind the registry where it does not conflict with E33-S05 pooling.
- [ ] Encode the material standard from `docs/technical/asset-baking-and-instancing.md`: built-in Three materials are the default; custom `ShaderMaterial` requires an explicit registry entry and documented justification.
- [ ] Track reference counts or explicit ownership so resources are disposed exactly once.
- [ ] Expose stats for geometry count, material count, texture count, and live resource keys.
- [ ] Reject resource creation from packet-ingestion modules by keeping the registry under `apps/client/src/game/renderer/`.
- [ ] Add tests proving duplicate keys return the same resource handles and disposal is idempotent.

## Acceptance criteria

- [ ] Shared geometries/materials are obtained through `RenderResourceRegistry`.
- [ ] Registry keys are deterministic and content-id based, not raw filenames.
- [ ] Default registered gameplay materials are built-in Three materials, not ad hoc custom shader materials.
- [ ] Disposal does not double-dispose shared resources.
- [ ] Resource stats can feed E35 diagnostics.
- [ ] No server/shared module imports the registry.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/RenderResourceRegistry.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

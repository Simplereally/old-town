# E32-S03 - Render Transform Cache

## Epic

E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E32-S02
- Blocks: E32-S04, E32-S05, E32-S06

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/snapshot-interpolation.md
- POC_SPEC.md §7.4
- POC_SPEC.md §11.4

## Objective

Implement `RenderTransformCache`, the pure render-state cache that turns sampled snapshots into numeric presentation transforms without storing Three objects.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/RenderTransformCache.test.ts`.
- [ ] Create `apps/client/src/game/renderer/RenderTransformCache.ts`.
- [ ] Export `RenderTransformCache`, `RenderEntityPresentation`, `MovementPresentationKind`, and `RenderTransformCacheOptions`.
- [ ] Store hot fields in struct-of-arrays typed arrays for entity id, previous tile x/y/plane, current tile x/y/plane, render x/y/z, heading, movement kind, and render handle id.
- [ ] Keep cold metadata such as `defId`, `appearance`, `kind`, and debug names in maps keyed by entity id.
- [ ] Implement `applySample(sample)` that updates numeric presentation values for every entity in the sampled snapshots.
- [ ] Implement tile-center linear interpolation for walk movement.
- [ ] Implement run movement as two-tile visual interpolation only when consecutive snapshot data proves a two-tile authoritative move; otherwise fall back to walk-speed interpolation.
- [ ] Implement teleport/snap by setting render position directly to authoritative tile and tagging `MovementPresentationKind.Teleport`.
- [ ] Implement `getPresentation(entityId)` returning plain numbers and metadata, not `Vector3`.
- [ ] Implement `forEachPresentation(callback)` without allocating arrays per frame.
- [ ] Implement removal of entities absent from the newest accepted authoritative snapshot when the packet semantics indicate removal.
- [ ] Do not import `three` in this module.

## Acceptance criteria

- [ ] Walk interpolation moves tile center to tile center over one server tick.
- [ ] Teleport samples do not interpolate through intervening tiles.
- [ ] Missing successor snapshots preserve hold/freeze behavior from `SnapshotBuffer`.
- [ ] `forEachPresentation` does not allocate per entity.
- [ ] The cache stores no `Object3D`, `Mesh`, `Group`, `Vector3`, `Matrix4`, or material references.
- [ ] Tests prove typed-array capacity growth preserves existing entities and does not expose stale removed entities.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/RenderTransformCache.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

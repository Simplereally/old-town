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

- [X] Write failing tests in `apps/client/src/game/renderer/RenderTransformCache.test.ts`.
- [X] Create `apps/client/src/game/renderer/RenderTransformCache.ts`.
- [X] Export `RenderTransformCache`, `RenderEntityPresentation`, `MovementPresentationKind`, and `RenderTransformCacheOptions`.
- [X] Store hot fields in struct-of-arrays typed arrays for entity id, previous tile x/y/plane, current tile x/y/plane, render x/y/z, heading, movement kind, and render handle id.
- [X] Keep cold metadata such as `defId`, `appearance`, `kind`, and debug names in maps keyed by entity id.
- [X] Implement `applySample(sample)` that updates numeric presentation values for every entity in the sampled snapshots.
- [X] Implement tile-center linear interpolation for walk movement.
- [X] Implement run movement as two-tile visual interpolation only when consecutive snapshot data proves a two-tile authoritative move; otherwise fall back to walk-speed interpolation.
- [X] Implement teleport/snap by setting render position directly to authoritative tile and tagging `MovementPresentationKind.Teleport`.
- [X] Implement `getPresentation(entityId)` returning plain numbers and metadata, not `Vector3`.
- [X] Implement `forEachPresentation(callback)` without allocating arrays per frame.
- [X] Implement removal of entities absent from the newest accepted authoritative snapshot when the packet semantics indicate removal.
- [X] Do not import `three` in this module.

## Acceptance criteria

- [X] Walk interpolation moves tile center to tile center over one server tick.
- [X] Teleport samples do not interpolate through intervening tiles.
- [X] Missing successor snapshots preserve hold/freeze behavior from `SnapshotBuffer`.
- [X] `forEachPresentation` does not allocate per entity.
- [X] The cache stores no `Object3D`, `Mesh`, `Group`, `Vector3`, `Matrix4`, or material references.
- [X] Tests prove typed-array capacity growth preserves existing entities and does not expose stale removed entities.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/RenderTransformCache.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

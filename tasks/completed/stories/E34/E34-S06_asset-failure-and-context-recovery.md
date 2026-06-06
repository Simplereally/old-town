# E34-S06 - Asset Failure and Context Recovery

## Epic

E34 - Worker Chunk Baking and Scene Residency

## Dependency chain

- Depends on: E34-S05
- Blocks: E35

## Spec references

- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Objective

Implement failure handling and recovery paths for worker bake failures, upload failures, resource disposal, and WebGL context loss.

## Implementation checklist

- [X] Write failing tests in `apps/client/src/game/renderer/RenderResourceRecovery.test.ts`.
- [X] Define failure states and error codes for bake failure, upload failure, missing material, invalid geometry payload, resource-disposed-use, and context loss.
- [X] Ensure failed chunk jobs can retry with bounded retry count and deterministic backoff measured in render frames, not gameplay ticks.
- [X] Ensure failed chunks expose debug status without changing authoritative gameplay state.
- [X] Add `webglcontextlost` and `webglcontextrestored` handling in `ThreeRenderer` or a renderer-owned coordinator.
- [X] On context loss, stop GPU uploads, mark resident resources invalid, and keep pure client world/snapshot state intact.
- [X] On context restore, recreate registry resources and requeue visible/resident chunks for bake/upload.
- [X] Ensure disposal paths are idempotent for chunk geometry, instance buckets, pooled transient objects, actor pools, and shared materials.
- [X] Add tests for failure, retry, disposal idempotence, and context restore requeue behavior.

## Acceptance criteria

- [X] Bake/upload failures do not crash the client render loop.
- [X] Failure/retry state is visible in diagnostics.
- [X] Context loss does not mutate server-authoritative or pure client world state.
- [X] Context restore requeues render resources from pure state and chunk metadata.
- [X] Disposal can be called repeatedly without double-free errors.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/RenderResourceRecovery.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run render:boundaries`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E34/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

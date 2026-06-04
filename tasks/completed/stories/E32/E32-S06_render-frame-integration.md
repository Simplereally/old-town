# E32-S06 - Render Frame Integration

## Epic

E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E32-S05
- Blocks: E33

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/snapshot-interpolation.md
- POC_SPEC.md §7
- POC_SPEC.md §8.4

## Objective

Wire `RenderClock`, `SnapshotBuffer`, `RenderTransformCache`, and movement policies into the client render frame so `GameEngine` renders presentation samples instead of packet-arrival mutations.

## Implementation checklist

- [ ] Write failing integration tests in `apps/client/src/game/GameEngine.snapshot-playout.test.ts` or extend `apps/client/src/game/GameEngine.test.ts`.
- [ ] Update `ThreeRenderer.onFrame` usage to pass RAF timestamp-derived sample data through `RenderClock`.
- [ ] In `GameEngine._onFrame`, sample `SnapshotBuffer` using `RenderClock.renderServerTimeMs`.
- [ ] Apply the returned `PresentationSample` to `RenderTransformCache`.
- [ ] Update actor scene rendering to read presentation transforms from `RenderTransformCache`.
- [ ] Update projectile, hitsplat, overhead chat, hover, camera follow, and debug overlays to use presentation transforms or explicit visual event queues.
- [ ] Keep camera follow presentational only; it must not feed gameplay tile state.
- [ ] Add debug overlay fields for snapshot buffer depth, presentation mode, render server time, latest accepted tick, and interpolation alpha.
- [ ] Ensure scene layer methods called from `_onFrame` are render-system methods only and do not reduce server packets.
- [ ] Keep the current UI panels functional after the packet-ingestion refactor.

## Acceptance criteria

- [ ] Remote actor visual movement remains smooth under a fake jittered 600ms packet sequence.
- [ ] No server tick is invented locally when the browser renders multiple frames between authoritative packets.
- [ ] `GameEngine` no longer calls actor position updates from network callbacks.
- [ ] Debug overlay exposes enough snapshot/playout state to diagnose jitter and freezes.
- [ ] Existing client smoke tests still pass.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/GameEngine.test.ts`
- [ ] `bun run test -- apps/client/src/game/GameEngine.snapshot-playout.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

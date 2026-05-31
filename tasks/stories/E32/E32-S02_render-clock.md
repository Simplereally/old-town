# E32-S02 - Render Clock

## Epic

E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E32-S01
- Blocks: E32-S03, E32-S04, E32-S05, E32-S06

## Spec references

- docs/technical/snapshot-interpolation.md
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Gaffer fixed timestep: https://gafferongames.com/post/fix_your_timestep/

## Objective

Implement `RenderClock`, a pure clock adapter that maps RAF timestamps to delayed server presentation time without creating local authoritative ticks.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/renderer/RenderClock.test.ts`.
- [ ] Create `apps/client/src/game/renderer/RenderClock.ts`.
- [ ] Export `RenderClock`, `RenderClockOptions`, and `RenderClockSample`.
- [ ] `RenderClockOptions` must include `tickMs`, `interpolationDelayMs`, `maxFrameDeltaMs`, and `serverTimeSmoothing`.
- [ ] Implement `syncToServer(packetTick, packetServerTimeMs, rafNowMs)` to update the estimated server-time offset.
- [ ] Implement `sample(rafNowMs)` returning `rafNowMs`, `frameDeltaMs`, `estimatedServerTimeMs`, `renderServerTimeMs`, and `clamped`.
- [ ] Compute `renderServerTimeMs` as `estimatedServerTimeMs - interpolationDelayMs`.
- [ ] Clamp `frameDeltaMs` to `maxFrameDeltaMs` after background-tab pauses.
- [ ] Use RAF timestamps supplied by `ThreeRenderer._renderLoop`; do not call `performance.now()` inside the pure sample path.
- [ ] Do not expose or implement a `while elapsed >= GAME_TICK_MS` loop for authoritative gameplay on the client.
- [ ] Do not import `three` in this module.

## Acceptance criteria

- [ ] The first sample after sync produces a render time one interpolation delay behind the estimated server time.
- [ ] 60Hz, 75Hz, 120Hz, and 144Hz timestamp sequences produce time-correct frame deltas.
- [ ] A long paused frame is clamped and reports `clamped: true`.
- [ ] Repeated sync packets can smooth server-time offset without moving render time backwards unless a full-state reset requires it.
- [ ] No local authoritative tick counter is advanced by elapsed browser time.
- [ ] The module is deterministic under fake timestamps and has no Three imports.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/RenderClock.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

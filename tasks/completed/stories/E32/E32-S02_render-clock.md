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

- [X] Write failing tests in `apps/client/src/game/renderer/RenderClock.test.ts`.
- [X] Create `apps/client/src/game/renderer/RenderClock.ts`.
- [X] Export `RenderClock`, `RenderClockOptions`, and `RenderClockSample`.
- [X] `RenderClockOptions` must include `tickMs`, `interpolationDelayMs`, `maxFrameDeltaMs`, and `serverTimeSmoothing`.
- [X] Implement `syncToServer(packetTick, packetServerTimeMs, rafNowMs)` to update the estimated server-time offset.
- [X] Implement `sample(rafNowMs)` returning `rafNowMs`, `frameDeltaMs`, `estimatedServerTimeMs`, `renderServerTimeMs`, and `clamped`.
- [X] Compute `renderServerTimeMs` as `estimatedServerTimeMs - interpolationDelayMs`.
- [X] Clamp `frameDeltaMs` to `maxFrameDeltaMs` after background-tab pauses.
- [X] Use RAF timestamps supplied by `ThreeRenderer._renderLoop`; do not call `performance.now()` inside the pure sample path.
- [X] Do not expose or implement a `while elapsed >= GAME_TICK_MS` loop for authoritative gameplay on the client.
- [X] Do not import `three` in this module.

## Acceptance criteria

- [X] The first sample after sync produces a render time one interpolation delay behind the estimated server time.
- [X] 60Hz, 75Hz, 120Hz, and 144Hz timestamp sequences produce time-correct frame deltas.
- [X] A long paused frame is clamped and reports `clamped: true`.
- [X] Repeated sync packets can smooth server-time offset without moving render time backwards unless a full-state reset requires it.
- [X] No local authoritative tick counter is advanced by elapsed browser time.
- [X] The module is deterministic under fake timestamps and has no Three imports.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/RenderClock.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

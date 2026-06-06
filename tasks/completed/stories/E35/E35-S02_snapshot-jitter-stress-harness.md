# E35-S02 - Snapshot Jitter Stress Harness

## Epic

E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E35-S01
- Blocks: E35-S03, E35-S04, E35-S05, E35-S06

## Spec references

- docs/technical/snapshot-interpolation.md
- docs/technical/performance-budgets.md
- Gaffer snapshot interpolation: https://gafferongames.com/post/snapshot_interpolation/

## Objective

Add a deterministic stress harness that feeds 600ms snapshots with jitter, loss, duplication, and out-of-order arrival through the snapshot/playout stack.

## Implementation checklist

- [X] Write tests in `apps/client/src/game/renderer/stress/snapshot-jitter.stress.test.ts`.
- [X] Create `apps/client/src/game/renderer/stress/SnapshotJitterHarness.ts`.
- [X] Generate a deterministic entity path over at least 120 server ticks.
- [X] Generate packet arrival schedules with configurable jitter, duplicate rate, drop rate, and reorder rate.
- [X] Feed arrivals into `ClientPacketIngestor`, `SnapshotBuffer`, `RenderClock`, and `RenderTransformCache` using fake RAF timestamps.
- [X] Assert no stale packet mutates accepted state.
- [X] Assert presentation mode distribution includes normal interpolation and expected hold/freeze modes under configured drops.
- [X] Assert render positions never exceed configured snap thresholds without producing `mode: "snap"`.
- [X] Assert local authoritative ticks are not invented between packet arrivals.
- [X] Add an npm/bun script alias if the repo uses separate stress commands; otherwise keep as Vitest stress file included in `bun run test`.

## Acceptance criteria

- [X] Harness proves jittered 600ms packets render through the snapshot buffer, not packet arrival alpha.
- [X] Duplicate, old, dropped, and reordered packets are covered.
- [X] Long gaps produce hold/freeze/snap policy results exactly as documented.
- [X] Test data is deterministic and does not depend on wall-clock time.
- [X] The stress test can run in CI without a real WebGL context.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/stress/snapshot-jitter.stress.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run render:boundaries`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

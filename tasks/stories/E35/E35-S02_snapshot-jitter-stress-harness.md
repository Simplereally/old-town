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

- [ ] Write tests in `apps/client/src/game/renderer/stress/snapshot-jitter.stress.test.ts`.
- [ ] Create `apps/client/src/game/renderer/stress/SnapshotJitterHarness.ts`.
- [ ] Generate a deterministic entity path over at least 120 server ticks.
- [ ] Generate packet arrival schedules with configurable jitter, duplicate rate, drop rate, and reorder rate.
- [ ] Feed arrivals into `ClientPacketIngestor`, `SnapshotBuffer`, `RenderClock`, and `RenderTransformCache` using fake RAF timestamps.
- [ ] Assert no stale packet mutates accepted state.
- [ ] Assert presentation mode distribution includes normal interpolation and expected hold/freeze modes under configured drops.
- [ ] Assert render positions never exceed configured snap thresholds without producing `mode: "snap"`.
- [ ] Assert local authoritative ticks are not invented between packet arrivals.
- [ ] Add an npm/bun script alias if the repo uses separate stress commands; otherwise keep as Vitest stress file included in `bun run test`.

## Acceptance criteria

- [ ] Harness proves jittered 600ms packets render through the snapshot buffer, not packet arrival alpha.
- [ ] Duplicate, old, dropped, and reordered packets are covered.
- [ ] Long gaps produce hold/freeze/snap policy results exactly as documented.
- [ ] Test data is deterministic and does not depend on wall-clock time.
- [ ] The stress test can run in CI without a real WebGL context.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/stress/snapshot-jitter.stress.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run render:boundaries`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

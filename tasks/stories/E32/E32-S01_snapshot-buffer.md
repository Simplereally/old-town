# E32-S01 - Snapshot Buffer

## Epic

E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E31-S04
- Blocks: E32-S02, E32-S03, E32-S04, E32-S05, E32-S06

## Spec references

- docs/technical/snapshot-interpolation.md
- docs/technical/render-ecs-architecture.md
- POC_SPEC.md §8.3
- POC_SPEC.md §8.4
- POC_SPEC.md §8.5

## Objective

Implement a pure `SnapshotBuffer` that stores accepted render snapshots by server tick and returns interpolation/hold/freeze/snap samples for a requested render server time.

## Implementation checklist

- [ ] Write failing tests in `apps/client/src/game/net/SnapshotBuffer.test.ts`.
- [ ] Create `apps/client/src/game/net/SnapshotBuffer.ts`.
- [ ] Export `RenderSnapshot`, `RenderEntitySnapshot`, `PresentationSample`, `PresentationSampleMode`, and `SnapshotBufferOptions`; `RenderSnapshot` must include `tick`, `sequence`, and `serverTimeMs`.
- [ ] `SnapshotBufferOptions` must include `tickMs`, `interpolationDelayMs`, `maxSnapshots`, `freezeAfterMissingTicks`, and `snapAfterMissingTicks`.
- [ ] Implement `reset(fullSnapshot)` that clears existing snapshots and accepts the full-state snapshot as the new baseline.
- [ ] Implement `insert(snapshot)` that rejects duplicate or older `(tick, sequence)` pairs and keeps snapshots sorted by `tick`, then `sequence`.
- [ ] Implement `latestAcceptedTick` and `depth` getters.
- [ ] Implement `sample(renderServerTimeMs)` that computes target tick position from server time, finds the older and newer snapshots, and returns `mode: "interpolate"` with `alpha` in `[0, 1]` when both are available.
- [ ] Return `mode: "hold_latest"` when the target time is newer than latest accepted but still inside the short-gap threshold.
- [ ] Return `mode: "freeze"` when the target time exceeds the short-gap threshold but is still inside the snap threshold.
- [ ] Return `mode: "snap"` when the missing duration exceeds the snap threshold or a snapshot carries a teleport/snap flag.
- [ ] Return `mode: "empty"` before any snapshot is accepted.
- [ ] Trim oldest snapshots only after preserving enough history for the current interpolation delay and test expectations.
- [ ] Do not import `three` in this module.

## Acceptance criteria

- [ ] Duplicate and older `(tick, sequence)` inserts are ignored.
- [ ] Out-of-order future inserts are stored in tick order.
- [ ] Sampling between two 600ms snapshots returns the correct older tick, newer tick, and alpha.
- [ ] Sampling before any snapshot returns `empty`.
- [ ] Sampling a short missing-successor gap returns `hold_latest`.
- [ ] Sampling a long gap returns `freeze` and then `snap` at configured thresholds.
- [ ] Full-state reset clears stale snapshots and restarts accepted tick ordering.
- [ ] The module is pure TypeScript data logic with no Three imports and no DOM/browser globals.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/net/SnapshotBuffer.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

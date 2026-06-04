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

- [X] Write failing tests in `apps/client/src/game/net/SnapshotBuffer.test.ts`.
- [X] Create `apps/client/src/game/net/SnapshotBuffer.ts`.
- [X] Export `RenderSnapshot`, `RenderEntitySnapshot`, `PresentationSample`, `PresentationSampleMode`, and `SnapshotBufferOptions`; `RenderSnapshot` must include `tick`, `sequence`, and `serverTimeMs`.
- [X] `SnapshotBufferOptions` must include `tickMs`, `interpolationDelayMs`, `maxSnapshots`, `freezeAfterMissingTicks`, and `snapAfterMissingTicks`.
- [X] Implement `reset(fullSnapshot)` that clears existing snapshots and accepts the full-state snapshot as the new baseline.
- [X] Implement `insert(snapshot)` that rejects duplicate or older `(tick, sequence)` pairs and keeps snapshots sorted by `tick`, then `sequence`.
- [X] Implement `latestAcceptedTick` and `depth` getters.
- [X] Implement `sample(renderServerTimeMs)` that computes target tick position from server time, finds the older and newer snapshots, and returns `mode: "interpolate"` with `alpha` in `[0, 1]` when both are available.
- [X] Return `mode: "hold_latest"` when the target time is newer than latest accepted but still inside the short-gap threshold.
- [X] Return `mode: "freeze"` when the target time exceeds the short-gap threshold but is still inside the snap threshold.
- [X] Return `mode: "snap"` when the missing duration exceeds the snap threshold or a snapshot carries a teleport/snap flag.
- [X] Return `mode: "empty"` before any snapshot is accepted.
- [X] Trim oldest snapshots only after preserving enough history for the current interpolation delay and test expectations.
- [X] Do not import `three` in this module.

## Acceptance criteria

- [X] Duplicate and older `(tick, sequence)` inserts are ignored.
- [X] Out-of-order future inserts are stored in tick order.
- [X] Sampling between two 600ms snapshots returns the correct older tick, newer tick, and alpha.
- [X] Sampling before any snapshot returns `empty`.
- [X] Sampling a short missing-successor gap returns `hold_latest`.
- [X] Sampling a long gap returns `freeze` and then `snap` at configured thresholds.
- [X] Full-state reset clears stale snapshots and restarts accepted tick ordering.
- [X] The module is pure TypeScript data logic with no Three imports and no DOM/browser globals.

## Validation commands

- [X] `bun run test -- apps/client/src/game/net/SnapshotBuffer.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

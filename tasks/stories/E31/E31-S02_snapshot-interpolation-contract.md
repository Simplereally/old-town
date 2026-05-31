# E31-S02 - Snapshot Interpolation Contract

## Epic

E31 - Render Architecture Contracts

## Dependency chain

- Depends on: E31-S01
- Blocks: E31-S03, E31-S04, E32

## Spec references

- ENGINE_AND_RENDERING.md
- docs/technical/render-ecs-architecture.md
- POC_SPEC.md §2.3
- POC_SPEC.md §2.4
- POC_SPEC.md §7.4
- POC_SPEC.md §8.3
- POC_SPEC.md §8.4
- POC_SPEC.md §8.5
- POC_SPEC.md §11.4
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Gaffer snapshot interpolation: https://gafferongames.com/post/snapshot_interpolation/
- Gaffer fixed timestep: https://gafferongames.com/post/fix_your_timestep/

## Objective

Create `docs/technical/snapshot-interpolation.md`, the exact contract for client snapshot buffering, playout timing, interpolation, hold/freeze/snap behavior, and local-player feedback.

## Required architectural decisions

- Old Town uses three clocks: server tick clock, client snapshot/playout clock, and browser RAF clock.
- Remote entities render at `estimatedServerTimeMs - interpolationDelayMs`.
- Default `interpolationDelayMs` is `GAME_TICK_MS` (600ms) until E35 metrics justify a different value.
- Minimum usable interpolation buffer is two accepted snapshots.
- Late packets with `tick <= latestAcceptedTick` are ignored unless they are an explicit full-state reset.
- Packet arrival timestamps are only diagnostics; they never produce render alpha.
- Authoritative gameplay never advances because a local RAF loop accumulated enough time.
- Local player feedback may show click markers and planned path hints immediately, but local position remains server-authoritative.

## Implementation checklist

- [ ] Create `docs/technical/snapshot-interpolation.md`.
- [ ] Define `RenderSnapshot` with exact fields: `tick`, `sequence`, `serverTimeMs`, `entities`, `events`, `regionLoads`, `regionUnloads`, and `debug`.
- [ ] Define `RenderEntitySnapshot` with exact fields: `entityId`, `kind`, `tile`, `previousTile`, `moveSpeed`, `facing`, `appearance`, `healthBar`, `defId`, and optional `presentationFlags`.
- [ ] Define `PresentationSample` with exact fields: `renderServerTimeMs`, `olderTick`, `newerTick`, `alpha`, `mode`, and `snapReason`.
- [ ] Define `PresentationSample.mode` as exactly `interpolate`, `hold_latest`, `freeze`, `snap`, or `empty`.
- [ ] Define how full-state packets reset snapshot state and clear older snapshots.
- [ ] Define how tick deltas become render snapshots without mutating Three.
- [ ] Define packet ordering as primary key `tick` and secondary key `sequence`; until the wire protocol carries `snapshotSequence`, `ClientPacketIngestor` must set `sequence = tick` and document that this is sufficient for one authoritative delta per server tick.
- [ ] Define walk interpolation as tile-center to tile-center over one tick.
- [ ] Define run interpolation as two tile steps per server tick when server data supports run; until then, treat `moveSpeed: "run"` as visual-only with no extra authoritative tile movement.
- [ ] Define teleport as no interpolation: hide/fade/flash optional, then snap to authoritative tile.
- [ ] Define combat lunge as visual-only offset that returns to authoritative tile before the next authoritative sample.
- [ ] Define projectile timing from `startTick` and `hitTick`, not `performance.now()` at packet arrival.
- [ ] Define gap handling: short gap holds latest snapshot; long gap freezes remote entity, then snaps with visual cue on recovery.
- [ ] Define tests required in E32 for out-of-order packets, duplicate ticks, missing successor snapshot, background-tab long RAF pause, teleport, local click marker, and projectile duration.
- [ ] Update `docs/00-index.md` with a link to `docs/technical/snapshot-interpolation.md`.

## Acceptance criteria

- [ ] `docs/technical/snapshot-interpolation.md` exists and contains the data shapes and policies above.
- [ ] The document explicitly bans deriving interpolation alpha from packet arrival time.
- [ ] The document explicitly bans local authoritative catch-up loops on the MMO client.
- [ ] The document defines exact default values for interpolation delay, minimum buffer depth, duplicate packet policy, and gap policy.
- [ ] The document explicitly keeps JSON packets for this graph and defers binary encoding until E35 metrics prove decode/ingest is the bottleneck.
- [ ] The document states which behavior is server-authoritative and which behavior is visual-only.
- [ ] `docs/00-index.md` links to the new document.

## Validation commands

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run tasks:status`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E31/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

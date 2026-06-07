# E32-S05 - Presentation Movement Policies

## Epic

E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E32-S04
- Blocks: E32-S06

## Spec references

- docs/technical/snapshot-interpolation.md
- POC_SPEC.md §2.4
- POC_SPEC.md §7.4
- POC_SPEC.md §11
- POC_SPEC.md §13.6

## Objective

Implement movement and transient-presentation policies on top of `RenderTransformCache`: walk, run, teleport, rejected moves, click markers, projectiles, hitsplats, and overhead chat must be timed from accepted server ticks or visual-only local feedback.

## Implementation checklist

- [X] Write failing tests in `apps/client/src/game/renderer/PresentationMovementPolicies.test.ts`.
- [X] Create `apps/client/src/game/renderer/PresentationMovementPolicies.ts` or equivalent render-domain module.
- [X] Implement walk presentation using sampled `RenderTransformCache` tile interpolation.
- [X] Implement run presentation as two-tile visual motion only when authoritative snapshot delta supports two tiles in one tick.
- [X] Implement teleport presentation as snap with optional render event; no interpolation through blocked/intermediate tiles.
- [X] Convert projectile lifetime to use `startTick`, `hitTick`, and `RenderClock.renderServerTimeMs` instead of `performance.now()` at spawn.
- [X] Convert hitsplat lifetime to use accepted server tick/time plus a visual duration constant.
- [X] Convert overhead chat lifetime to use serverTime from chat packets plus a visual duration constant.
- [X] Preserve immediate click marker feedback as client-only UI state; it must never write `serverTile` or `RenderTransformCache` truth fields.
- [X] Preserve move rejection feedback by comparing accepted server/debug path results to the last click tile.
- [X] Add tests for background-tab pause clamping so projectiles/hitsplats complete deterministically without running a huge local catch-up loop.

## Acceptance criteria

- [X] Walk, run, teleport, projectile, hitsplat, and overhead chat timing are documented in tests.
- [X] Projectile progress is based on server tick timing, not packet arrival or spawn wall-clock time.
- [X] Click markers appear immediately but do not alter authoritative or presentation entity transforms.
- [X] Rejected move feedback still logs and/or displays when the server rejects the last click.
- [X] No movement policy imports server modules or mutates gameplay state.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/PresentationMovementPolicies.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint` (no lint script configured in client package)

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

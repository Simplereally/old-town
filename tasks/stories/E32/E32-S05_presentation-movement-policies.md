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

- [ ] Write failing tests in `apps/client/src/game/renderer/PresentationMovementPolicies.test.ts`.
- [ ] Create `apps/client/src/game/renderer/PresentationMovementPolicies.ts` or equivalent render-domain module.
- [ ] Implement walk presentation using sampled `RenderTransformCache` tile interpolation.
- [ ] Implement run presentation as two-tile visual motion only when authoritative snapshot delta supports two tiles in one tick.
- [ ] Implement teleport presentation as snap with optional render event; no interpolation through blocked/intermediate tiles.
- [ ] Convert projectile lifetime to use `startTick`, `hitTick`, and `RenderClock.renderServerTimeMs` instead of `performance.now()` at spawn.
- [ ] Convert hitsplat lifetime to use accepted server tick/time plus a visual duration constant.
- [ ] Convert overhead chat lifetime to use serverTime from chat packets plus a visual duration constant.
- [ ] Preserve immediate click marker feedback as client-only UI state; it must never write `serverTile` or `RenderTransformCache` truth fields.
- [ ] Preserve move rejection feedback by comparing accepted server/debug path results to the last click tile.
- [ ] Add tests for background-tab pause clamping so projectiles/hitsplats complete deterministically without running a huge local catch-up loop.

## Acceptance criteria

- [ ] Walk, run, teleport, projectile, hitsplat, and overhead chat timing are documented in tests.
- [ ] Projectile progress is based on server tick timing, not packet arrival or spawn wall-clock time.
- [ ] Click markers appear immediately but do not alter authoritative or presentation entity transforms.
- [ ] Rejected move feedback still logs and/or displays when the server rejects the last click.
- [ ] No movement policy imports server modules or mutates gameplay state.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/PresentationMovementPolicies.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

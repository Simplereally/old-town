# E59-S02 — Run-toggle intent, forced-walk enforcement, and client energy orb

## Epic

E59 — Run Energy, Item Weight, and the Stamina Economy

## Dependency chain

- Depends on: E59-S01
- Blocks: E59-S03

## Objective

The player-facing loop: a run toggle that the server honors only when energy allows, and an
energy orb that renders server truth.

## Implementation guidance

- **Intent**: check how movement mode is set today — `MoveIntent` carries a mode or a separate
  toggle exists (read the intent schemas in `packages/shared` and the dispatcher). If mode
  rides on `MoveIntent`, add a standalone `{kind:"set_run", enabled}` intent anyway: the OSRS
  toggle is stateful, not per-click. Server accepts the toggle-on only if energy > 0 (else
  responds with current state — the packet below makes the client consistent either way).
- **S2C**: energy + mode must reach the client every time they change. Find how per-entity
  stat-like values flow (HP must already stream via the delta path — mirror exactly; do NOT
  invent a new packet if a component-delta channel already carries stats). Register any new
  shape in the E48 wire validation.
- **Client orb**: an energy orb near the minimap/HP display — find the existing HP/stat
  display in `UIManager.ts` and match its idiom. Shows percentage (value/100), dims at 0,
  click = toggle run (sends the intent). Run state also visible on the orb (boot icon or
  color per existing visual language — check `docs/world/` visual specs for palette guidance).
- **Prediction note**: the client may optimistically flip the toggle visual on click but MUST
  reconcile to the next packet (test: server refuses at 0 energy → orb snaps back).

## Required work

- [ ] Toggle intent + validation + dispatcher routing + server-side acceptance rule.
- [ ] Energy/mode delta streaming + wire registration.
- [ ] Orb UI + click handling + jsdom tests (renders value, toggles, reconciles on refusal,
      dims at 0).
- [ ] Integration test: scripted session toggles run, moves, drains, hits 0, gets forced to
      walk, regens, re-toggles.

## Acceptance criteria

- [ ] Toggle round-trip ≤ 1 tick; orb never diverges from server value for more than the
      optimistic window.
- [ ] Forced walk is visually obvious (orb + toggle state) without a chat message.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

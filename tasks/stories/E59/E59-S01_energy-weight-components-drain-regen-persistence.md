# E59-S01 — Energy and weight components, drain/regen model, persistence

## Epic

E59 — Run Energy, Item Weight, and the Stamina Economy

## Dependency chain

- Depends on: none
- Blocks: E59-S02

## Objective

The server-side resource model: energy and weight components, integer drain/regen math wired
into the movement phase, snapshot persistence.

## Implementation guidance

- **Components**: `runEnergy: {current: int 0–10000}` and `carriedWeight: {grams: int}` —
  find how existing components are declared/registered in `apps/server/src/ecs` and mirror.
  Weight recompute hooks onto inventory mutation: find the single choke point where inventory
  changes land (the inventory module used by `item-actions.ts`/bank/ground-item systems) and
  recompute there; assert in a test that a pickup/drop/bank-deposit each update weight exactly
  once.
- **Drain model** (OSRS-flavored, integer): per run-step drain =
  `BASE_DRAIN + floor(weightGrams * WEIGHT_FACTOR / 1000)` hundredths, clamped ≥ BASE_DRAIN;
  regen per tick while walking or idle = `REGEN_PER_TICK` hundredths. Constants in
  `packages/shared/src/constants` (find the existing constants module) with doc comments
  giving the intended feel ("~1 minute of full-weight running"). Drain applies in
  `movement-system.ts` where `stepCount` is computed (line 234 area): if mode is run and
  energy < cost of this tick's steps, downgrade the tick to walk BEFORE stepping (never step
  then go negative — energy floors at 0, no debt).
- **Forced-walk rule**: when energy hits 0, flip the movement mode component to `"walk"` (the
  persistent mode, not just this tick) so the entity stays walking until the player re-toggles
  after regen. Do not clear the current path/destination.
- **Persistence**: snapshot field `runEnergy` (default 10000 for existing saves). Bump
  `CHARACTER_SNAPSHOT_VERSION`; add the E62 migration hop if the chain landed, else follow the
  manual-bump practice and note it. Weight is derived — never persisted.
- **RNG/determinism**: the model is arithmetic, no rng. Note in the code that drain must stay
  deterministic (E56 goldens will cover movement).

## Required work

- [ ] Components + registration + weight recompute at the inventory choke point.
- [ ] Drain/regen in the movement phase with the downgrade-before-step rule; constants module.
- [ ] Snapshot field + version bump + round-trip tests (old snapshot without the field loads
      at full energy).
- [ ] Unit tests: drain scales with weight; regen while walking and while idle; 0-energy
      downgrade preserves destination; 2-step run tick drains exactly one run cost; weight
      cache updates on pickup/drop/equip/unequip/bank both directions.

## Acceptance criteria

- [ ] All math integer (grep the diff for `.` float literals in gameplay paths — none).
- [ ] No per-tick weight recomputation (review criterion: recompute only on mutation).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`

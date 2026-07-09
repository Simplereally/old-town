# E59 — Run Energy, Item Weight, and the Stamina Economy

## Dependency chain

- Depends on: nothing hard. Soft: E62 (energy persists in the snapshot → one migration hop if
  the chain exists; manual bump otherwise)
- Unlocks: movement as a resource decision; the first real sink for the `apothecary` skill;
  meaningful weight on gear choices (armour vs mobility)

## Spec references

- `apps/server/src/systems/movement-system.ts` — `moveSpeed(mode)` maps `run → 2 steps/tick`
  (`movement-system.ts:60–61`, step count at line 234); movement mode defaults to `"walk"`
  (lines 87, 126). This is the entire current cost model: run is strictly better, free.
- `packages/shared/src/content-schemas/item.ts:92` — `weight: z.number().optional()` already
  exists in the item schema but nothing reads it; audit which content items set it before
  choosing units (assume kg-like decimals; store as integer grams server-side — integer world).
- `content/skills/processing.json:51` — the `apothecary` skill id exists with no products.
- `packages/shared/src/persistence/character-snapshot.ts` — energy must persist (version bump).
- `apps/server/src/systems/consumable-system.ts` — the eat/drink pipeline energy potions will
  ride.
- 🔒 AGENTS.md invariants: integer world (energy is an integer, e.g. 0–10000 hundredths),
  600 ms tick (drain/regen are per-tick integer deltas), content-driven (potion effects are
  JSON, not code).

## Epic goal

OSRS-shaped run energy: running drains energy as a function of carried weight, walking (and
resting-by-standing) regenerates it, hitting zero forces walk, and the client shows an energy
orb + run toggle. Item weight becomes real. The apothecary skill gets its first reason to
exist: craftable energy/stamina potions that restore or temporarily reduce drain. All values
content-tunable; all math integer.

## Design invariants (bind every story)

- Energy is server truth: an integer 0–10000 (hundredths of a percent) on a component,
  persisted in the snapshot. The client never simulates it — it renders the packeted value.
- Drain/regen happen in the movement phase from actual steps taken this tick (2-step run tick
  drains once at run cost; a run-mode entity that didn't move drains nothing).
- Weight is the integer sum of carried inventory + equipped item weights, recomputed on
  inventory change (not per tick), cached on a component.
- Zero client-trusted state: the run toggle sends an intent; the server flips `MovementMode`
  only if energy > 0.
- All tuning constants (base drain, weight scaling, regen rate, potion effects) live in shared
  constants or content JSON — a balance pass must never require engine edits.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E59/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E59-S01` — [Energy and weight components, drain/regen model, persistence](../stories/E59/E59-S01_energy-weight-components-drain-regen-persistence.md)
- [ ] `E59-S02` — [Run-toggle intent, forced-walk enforcement, and client energy orb](../stories/E59/E59-S02_run-toggle-intent-forced-walk-and-energy-orb.md)
- [ ] `E59-S03` — [Apothecary products: energy and stamina potions end-to-end](../stories/E59/E59-S03_apothecary-energy-and-stamina-potions.md)
- [ ] `E59-S04` — [Balance pass, content audit, and integration suite](../stories/E59/E59-S04_balance-pass-content-audit-and-integration-suite.md)

## Epic acceptance criteria

- [ ] A character running with an empty inventory crosses the whole starter town before
      exhausting; a max-weight character exhausts in roughly half that distance (exact numbers
      pinned by the S04 balance table, asserted in tests).
- [ ] At 0 energy the server forces walk mid-path without losing the queued destination; the
      client orb and toggle reflect it within one tick.
- [ ] An energy potion crafted via apothecary restores energy; a stamina potion halves drain
      for a content-defined duration; both effects visible in the orb.
- [ ] Energy survives logout/login (snapshot round-trip test).

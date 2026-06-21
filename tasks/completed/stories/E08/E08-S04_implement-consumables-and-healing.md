# E08-S04 — Implement consumables and healing

## Epic

E08 — Inventory, Equipment, Items, and Character Stats

## Dependency chain

- Depends on: E08-S03
- Blocks: next story in `E08` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §16
- POC_SPEC.md §20
- POC_SPEC.md §27

## Objective

Make food and consumables work inside the tick phase order with explicit combat interaction hooks.

## Implementation checklist

- [X] Implement ConsumableDef handling.
- [X] Heal HP up to max HP.
- [X] Consume item on successful eat.
- [X] Apply configured eat delay/cooldown component.
- [X] Document and test whether healing occurs before or after pending hit application according to phase order.
- [X] Emit hitsplat/health/inventory deltas.

## Acceptance criteria

- [X] Food cannot overheal beyond max HP unless content explicitly allows it.
- [X] Eating invalid/non-food item fails without mutation.
- [X] Tick priority is explicit and tested.

## Validation commands

- [X] `bun run test`

## Implementation notes

- Eating is split across tick phases. The eat **request** is validated at `InputClose` in
  `apps/server/src/items/item-actions.ts`: the food is consumed (one unit leaves the inventory),
  the content-defined eat delay (`consumeTicks`) is written to `CombatantComponent.eatBlockedUntilTick`,
  and the heal is enqueued. The HP restore is **applied** later, in `apps/server/src/systems/consumable-system.ts`
  (`ConsumableSystem.processConsumablePhase`), registered on `TickPhase.FoodPotionPrayerStatChanges`.
- **Tick priority (documented choice):** `FoodPotionPrayerStatChanges` (phase 9) runs strictly
  after `DamageResolutionEvents` (phase 8) per `TICK_PHASE_ORDER` / POC_SPEC §9.1. Therefore a
  delayed hit that resolves on the same tick as an eat lands **before** the food heals — healing
  never pre-empts a same-tick incoming hit. Enforced structurally, asserted in
  `consumable-system.test.ts` ("damage resolves before food heals").
- Heals clamp to `maxHealth` (no overheal; no content field opts into it). Full-HP eats consume
  the food but emit no health/hitsplat deltas.
- Deltas emitted: inventory (item consumed), `heal` hitsplat (amount restored), and `healthBar`
  entity update. The dev player is seeded with 5× `bread` so the path is exercisable in-game.

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E08/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

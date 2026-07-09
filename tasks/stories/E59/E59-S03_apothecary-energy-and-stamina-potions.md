# E59-S03 — Apothecary products: energy and stamina potions end-to-end

## Epic

E59 — Run Energy, Item Weight, and the Stamina Economy

## Dependency chain

- Depends on: E59-S02
- Blocks: E59-S04

## Objective

Give the `apothecary` skill (`content/skills/processing.json:51`) its first products: an
energy potion (instant restore) and a stamina potion (timed drain reduction), craftable from
gatherable ingredients, consumable through the existing pipeline.

## Implementation guidance

- **Content first**: read `docs/content/00-index.md` and the existing processing-skill content
  (how smelting/cooking recipes are declared) — apothecary recipes must be the same shape. Two
  recipes: energy potion (restores a content-defined amount, e.g. 4000 hundredths) and stamina
  potion (multiplies drain by a content-defined factor, e.g. 50%, for a content-defined
  duration in ticks). Ingredients: pick from existing gatherable content if any herb/plant
  exists; if none, add ONE gatherable (e.g. a marsh herb node near River Stoop — check
  `docs/world/districts-and-routes.md` for placement authority) — keep it minimal, this is not
  a herblore epic.
- **Effect mechanics**: instant restore goes through `consumable-system.ts` like food heals —
  read how healing is applied and mirror. The stamina effect needs a timed-status mechanism:
  check whether any timed buff exists (boosts? poison?) — if a status/timer component pattern
  exists, reuse it; if not, add a minimal `statusEffects: [{id, expiresAtTick, params}]`
  component consumed by the movement drain calc (S01's drain formula reads the multiplier).
  Document the decision — this component is the seed of a future buffs system, keep it dumb.
- **XP + level gating**: crafting grants apothecary XP per the recipe; recipe level
  requirements per content. Mirror exactly how smelting gates + grants (find it in the
  skilling system).
- Weight the potions (they're items — set `weight` in their JSON; vials should be light).

## Required work

- [ ] Recipe + item + (if needed) gatherable-node content JSON, validating via
      `bun run content:validate`.
- [ ] Timed-status mechanism (reuse or minimal new component) + drain integration.
- [ ] Consumable wiring + XP + level gating.
- [ ] Tests: craft (level-gated, consumes ingredients, grants XP); drink energy potion
      restores and clamps at max; stamina effect halves drain and expires on the right tick;
      effect survives nothing (no persistence of active buffs — document that logout clears
      them, OSRS-authentic and cheap; revisit if it ever matters).
- [ ] Icons: potion icons through the existing item-icon pipeline
      (`scripts/generate-item-icons.*` + `bun run` asset validation — check
      `scripts/validate-item-assets.ts` requirements; consider the old-town-asset-craft skill
      conventions).

## Acceptance criteria

- [ ] Full loop by hand in `bun run dev`: gather → craft → drink → observe orb/drain change.
- [ ] Zero hardcoded potion behavior in engine code (effects driven by recipe/item JSON
      params — review criterion).

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`

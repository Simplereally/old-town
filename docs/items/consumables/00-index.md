# Consumables Index

> **Entry point for consumable item definitions in Old Town.** This doc defines item IDs, stats, and counts. For the canonical consumables system design (families, mechanics, identity), see `docs/consumables/00-index.md`.
>
> **Rule:** All consumable names must match the canonical resource taxonomy in `docs/resources/resource-taxonomy.md` and the canonical consumables system in `docs/consumables/consumable-system.md`.

## Consumable Categories

| Category | Doc | Count | Status | What is inside |
|----------|-----|-------|--------|----------------|
| **Food** | [`food.md`](food.md) | 16 | Complete | Food items, healing values |
| **Potions** | [`potions.md`](potions.md) | 16 | Complete | Potion items, effects |

## Canonical Consumables System

For the full consumables system design, including families, mechanics, identity, and cultural framing, see:

- [`../../consumables/00-index.md`](../../consumables/00-index.md) — Consumables navigation hub
- [`../../consumables/consumable-system.md`](../../consumables/consumable-system.md) — Core consumable authority
- [`../../consumables/food.md`](../../consumables/food.md) — Food system (market, workshop, trail, combat, combo, stews, teas)
- [`../../consumables/potions.md`](../../consumables/potions.md) — Potion system (tinctures, draughts, tonics, phials)
- [`../../consumables/brews.md`](../../consumables/brews.md) — Brew system (tradeoffs, downsides, backfire)
- [`../../consumables/poisons.md`](../../consumables/poisons.md) — Poison system (darts, knives, sleight, wardenry)
- [`../../consumables/salves-and-oils.md`](../../consumables/salves-and-oils.md) — Salves and oils (cures, weapon coatings)
- [`../../consumables/status-effects.md`](../../consumables/status-effects.md) — Status effects (sources, cures, prevention)

## Resource Taxonomy

For canonical resource names (fish, herbs, woods, ores), see:

- [`../../resources/00-index.md`](../../resources/00-index.md) — Resources navigation hub
- [`../../resources/resource-taxonomy.md`](../../resources/resource-taxonomy.md) — Canonical resource names and banned list
- [`../../resources/fish-and-cooking.md`](../../resources/fish-and-cooking.md) — Fish taxonomy
- [`../../resources/herbs-roots-and-fungi.md`](../../resources/herbs-roots-and-fungi.md) — Herb taxonomy

## Consumable System Overview

Consumables are the rhythm of survival. Food heals. Potions restore. Brews transform. Poisons kill. Salves cure. Oils buff. They are essential for sustained combat, skilling, and exploration.

**Key principles:**
- **Food is healing.** It should be abundant, cheap, and easy to obtain.
- **Potions are burst.** They should be expensive, crafted, and situational.
- **Brews are dangerous.** Powerful effects with punishing downsides.
- **Poisons are economy.** Crafted by Apothecary, sold on the black market.
- **Cooking is the bridge.** Raw resources become consumables through the cooking skill.
- **No instant full heals.** Food heals in chunks. Potions heal more but are rarer.

## Eat Delay

**3 ticks** (1.8 seconds) after eating food. This prevents spam-eating.

## Stackable vs Non-Stackable

| Stackable | Non-Stackable |
|-----------|---------------|
| Food | Brews |
| Potions | Salves |
| Raw fish | Oils |
| Poisons | — |

## Design Rules

1. **Food is abundant and cheap.** Players should never struggle to find basic food.
2. **Potions are crafted and expensive.** They require skill investment (Apothecary) and resources.
3. **Brews are dangerous.** Every brew has a tradeoff and a backfire chance.
4. **Poisons are illegal.** Carrying poison in town zones may trigger guard confrontation.
5. **No instant full heals.** Even endgame food heals in chunks.
6. **Tick eating is intentional.** Food heals on the tick it is eaten.
7. **Food has an eat delay.** 3 ticks between eating.
8. **Potions have doses.** A potion vial has 4 doses.
9. **Raw food must be cooked.** Fishing gives raw fish. Cooking transforms it.
10. **Burning is possible.** Cooking can fail, burning the food.
11. **Stat boost potions are temporary.** They last 60 ticks.
12. **All names must match canonical taxonomy.** No `health potion`, `strength potion`, `mana potion`, `antipoison`.

## Related Documents

- [`food.md`](food.md) — Food item definitions
- [`potions.md`](potions.md) — Potion item definitions
- [`../../consumables/00-index.md`](../../consumables/00-index.md) — Canonical consumables system
- [`../../resources/00-index.md`](../../resources/00-index.md) — Canonical resource taxonomy
- [`../../POC_SPEC.md`](../../POC_SPEC.md) §16 (Items, inventory, equipment)

---

*Total consumables defined: 32 (16 food + 16 potions)*
*Canonical consumables system: docs/consumables/*
*Last updated: 2026-05-30*

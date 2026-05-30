# Consumables Index

> **Entry point for all consumable documentation in Old Town.** This is the canonical index for consumables. Navigate to the specific type you need.

## Consumable Categories

| Category | Doc | Count | Status | What is inside |
|----------|-----|-------|--------|----------------|
| **Food** | [`food.md`](food.md) | 11 | Complete | Food items, healing values |
| **Potions** | [`potions.md`](potions.md) | 16 | Complete | Potion items, effects |

## Consumable System Overview

Consumables are the rhythm of survival. Food heals. Potions restore. Both are essential for sustained combat, skilling, and exploration.

**Key principles:**
- **Food is healing.** It should be abundant, cheap, and easy to obtain.
- **Potions are burst.** They should be expensive, crafted, and situational.
- **Cooking is the bridge.** Raw resources become consumables through the cooking skill.
- **No instant full heals.** Food heals in chunks. Potions heal more but are rarer.

## Eat Delay

**3 ticks** (1.8 seconds) after eating food. This prevents spam-eating.

## Stackable vs Non-Stackable

| Stackable | Non-Stackable |
|-----------|---------------|
| Food | — |
| Potions | — |
| Raw fish | — |

## Design Rules

1. **Food is abundant and cheap.** Players should never struggle to find basic food.
2. **Potions are crafted and expensive.** They require skill investment (Herblore) and resources.
3. **No instant full heals.** Even endgame food heals in chunks.
4. **Tick eating is intentional.** Food heals on the tick it is eaten.
5. **Food has an eat delay.** 3 ticks between eating.
6. **Potions have doses.** A potion vial has 4 doses.
7. **Raw food must be cooked.** Fishing gives raw fish. Cooking transforms it.
8. **Burning is possible.** Cooking can fail, burning the food.
9. **Some food is multi-bite.** Meat pies have 2 bites.
10. **Stat boost potions are temporary.** They last 60 ticks.

## Related Documents

- [`food.md`](food.md) — Food items
- [`potions.md`](potions.md) — Potion items
- [`POC_SPEC.md`](../../POC_SPEC.md) §16 (Items, inventory, equipment)

---

*Total consumables defined: 27 (11 food + 16 potions)*

# Food

> All food items in Old Town. Food is the primary healing method.

## Food System Overview

Food is consumed immediately, heals HP, and applies an eat delay (cannot eat again for 3 ticks).

**Food mechanics:**
- Food is stackable (up to 28 per inventory slot)
- Eating food consumes 1 item from the stack
- Food heals immediately on the tick it is eaten
- Food can be eaten during combat (tick eating)
- Food can be burned during cooking (failing the cooking roll)

## Food Types

| Item ID | Name | Heals | Cooking Level | Burn Chance | Notes |
|---------|------|-------|--------------|-------------|-------|
| `apple` | Apple | 3 HP | 1 | 0% | Foraged, no cooking needed |
| `bread` | Bread | 5 HP | 1 | 5% | Starter food, baked |
| `cooked_fish` | Cooked Fish | 8 HP | 5 | 10% | Basic cooked fish |
| `cooked_trout` | Cooked Trout | 10 HP | 15 | 15% | Stream fish |
| `cooked_salmon` | Cooked Salmon | 12 HP | 25 | 20% | River fish |
| `meat_pie` | Meat Pie | 14 HP | 30 | 25% | Crafted food, two bites |
| `cooked_lobster` | Cooked Lobster | 16 HP | 40 | 25% | Ocean fish |
| `stew` | Stew | 18 HP | 45 | 30% | Bowl food, single use |
| `cooked_shark` | Cooked Shark | 24 HP | 80 | 30% | Deep ocean fish |
| `cooked_manta` | Cooked Manta Ray | 28 HP | 91 | 35% | Elite fish |
| `cooked_rocktail` | Cooked Rocktail | 32 HP | 93 | 35% | Endgame fish |

## Food Tiers by Game Stage

| Stage | Food | Heals | Source |
|-------|------|-------|--------|
| Tutorial | Apple, Bread | 3-5 HP | Foraged, baked |
| Early game | Cooked Fish, Cooked Trout | 8-10 HP | Fishing + Cooking |
| Mid game | Cooked Salmon, Meat Pie | 12-14 HP | Fishing + Cooking |
| Mid-late | Cooked Lobster, Stew | 16-18 HP | Fishing + Cooking |
| Late game | Cooked Shark | 24 HP | Deep fishing |
| Endgame | Cooked Manta, Cooked Rocktail | 28-32 HP | Elite fishing |

## Special Food

| Item ID | Name | Heals | Effect | Notes |
|---------|------|-------|--------|-------|
| `meat_pie` | Meat Pie | 14 HP | Two bites | Each bite heals 7 HP. Total 14 HP. |
| `stew` | Stew | 18 HP | Single use | Bowl food, consumed entirely. |
| `bread` | Bread | 5 HP | Baked | Made from flour + water + fire. |

## Related Documents

- [`potions.md`](potions.md) — Potion items
- [`00-index.md`](00-index.md) — Consumables overview

---

*Total food items defined: 11*

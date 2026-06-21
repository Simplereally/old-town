---
doc_type: index
canonical_path: docs/consumables/00-index.md
parent_index: docs/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Docs Index`](../00-index.md)

# Consumables

> **The canonical consumables system of Old Town.** Every food, potion, brew, poison, salve, and oil in the world is defined here. Consumables make the economy alive and give combat/skilling actual day-to-day item demand.
>
> **Rule:** No consumable may be introduced without a canonical name, a production skill, and at least one gameplay effect.

---

## Consumable Families

| Document | Status | Description |
|----------|--------|-------------|
| [`consumable-system.md`](consumable-system.md) | Complete | Core authority: families, mechanics, design rules |
| [`food.md`](food.md) | Complete | Food system: market, workshop, trail, combat, combo, stews, teas |
| [`potions.md`](potions.md) | Complete | Potions: tinctures, draughts, tonics, phials, cordials |
| [`brews.md`](brews.md) | Complete | Brews: powerful effects with tradeoffs and downsides |
| [`poisons.md`](poisons.md) | Complete | Poisons: darts, knives, sleight, wardenry economy |
| [`salves-and-oils.md`](salves-and-oils.md) | Complete | Salves, cures, weapon coatings, anti-rot, anti-venom |
| [`status-effects.md`](status-effects.md) | Complete | Status effects and their cures |

---

## Quick Reference

| Consumable | Family | Production Skill | Primary Effect | Example Item ID |
|------------|--------|------------------|---------------|----------------|
| **Bellbread** | Food | Cooking | 5 HP | `bellbread` |
| **Tinfin Pie** | Food | Cooking | 7 HP + combo | `tinfin_pie` |
| **Rockclaw Roll** | Food | Cooking | 18 HP | `rockclaw_roll` |
| **Deepwater Eel Broth** | Food | Cooking | 22 HP + stamina | `eel_broth` |
| **Arms Tincture** | Potion | Apothecary | +3 Arms | `arms_tincture` |
| **Might Draught** | Potion | Apothecary | +3 Might | `might_draught` |
| **Guard Tonic** | Potion | Apothecary | +3 Guard | `guard_tonic` |
| **Sight Bitters** | Potion | Apothecary | +3 Ranged | `sight_bitters` |
| **Wit Phial** | Potion | Apothecary | +3 Magic | `wit_phial` |
| **Favour Cordial** | Potion | Apothecary | +3 Favour | `favour_cordial` |
| **Cleanblood Salve** | Salve | Apothecary | Cure poison | `cleanblood_salve` |
| **Road Tea** | Potion | Apothecary | Restore stamina | `road_tea` |
| **Blacksealed Brew** | Brew | Apothecary | +5 all stats, -5 afterwards | `blacksealed_brew` |
| **Blacksalt Venom** | Poison | Apothecary | Poison damage | `blacksalt_venom` |
| **Carmine Oil** | Oil | Apothecary | +5% weapon damage | `carmine_oil` |
| **Graveyard Tea** | Tea | Cooking | +2 Favour | `graveyard_tea` |
| **Warden Ration** | Trail Food | Cooking | 12 HP, no burn | `warden_ration` |

---

## Naming Rules

1. **No generic fantasy names.** `health potion`, `strength potion`, `mana potion`, `antipoison` are banned. Use Old Town names.
2. **Kebab-case IDs.** All item IDs use lowercase with hyphens.
3. **Production skill suffix.** Consumables are named after their production skill: `apothecary_*`, `cooking_*`, `hearthcraft_*`.
4. **Effect in name.** The name should hint at the effect: `Arms Tincture`, `Might Draught`, `Cleanblood Salve`.
5. **Cultural framing.** Every consumable has a story: `Graveyard Tea` is brewed with graveyard moss. `Warden Ration` is dried for wardens on contract.

## Related Documents

- [`../skills/00-index.md`](../skills/00-index.md) — Skills navigation hub
- [`../resources/00-index.md`](../resources/00-index.md) — Resources navigation hub
- [`../items/consumables/00-index.md`](../items/consumables/00-index.md) — Consumable item definitions
- [`../combat/signature-mechanics.md`](../combat/signature-mechanics.md) — Combat mechanics

---

*Total consumable families: 7*
*Total consumables defined: 40+*
*Last updated: 2026-05-30*

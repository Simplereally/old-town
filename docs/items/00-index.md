# Item System Index

> **Entry point for all item documentation in Old Town.** This is the canonical index for items. If you are looking for an item, start here and navigate to the right category.
> 
> **Maintenance rule:** When adding a new item category, create a new folder and register it here. When adding a new item, add it to the right leaf doc. Counts are intentionally not hand-maintained in this index; item tables in leaf documents are authoritative.

## Item System Overview

Old Town items are content-driven. Every item has a definition in `content/items/*.json` that is validated by a Zod schema and loaded into a runtime registry on server boot. Items are not hardcoded in the engine.

**Key principles:**
- **Tiers are cultural, not elemental.** Pennywrought is cheap and local; Wardensteel is disciplined; Starfall is mythic.
- **Families are reusable.** A "Shortblade" is always a one-handed sword. A "Fellaxe" is always a battleaxe.
- **Shorthand must be sticky.** Players will say "penny sword," "full bell," "warden set."
- **Cobbled is the joke.** Tutorial gear. It should look like garbage.
- **Starfall is the mythic.** It should feel like a different material category.

## Tier Quick Reference

| Order | Tier | Shorthand | Visual Identity |
|------|------|-----------|-----------------|
| 0 | **Cobbled** | cobbled | Wood, straps, nails, chipped iron |
| 1 | **Pennywrought** | penny | Dull copper-brown, cheap rivets, rope grips |
| 2 | **Pig Iron** | pig | Dark crude iron, heavy heads, blunt edges |
| 3 | **Bellmetal** | bell | Brass/gold alloy, warm shine, town-forged |
| 4 | **Blackbar** | bar | Blackened iron, old gate/prison-bar look |
| 5 | **Wardensteel** | warden | Steel with blue/white town-guard trim |
| 6 | **Greenwold** | greenwold | Green enamel, forest metal, vine etching |
| 7 | **Graveiron** | grave | Charcoal steel, bone-white accents |
| 8 | **Blueglass** | blueglass | Blue inlays, polished steel, glassy gems |
| 9 | **Carmine Steel** | carmine | Red lacquer, black leather, silver edges |
| 10 | **Argent** | argent | Bright silver, clean highlights, noble trim |
| 11 | **Crownsteel** | crown | Gold edging, white/silver plates, heraldic |
| 12 | **Starfall** | starfall | Dark steel, pale highlights, meteor flecks |

**Full tier philosophy:** [`melee-armour-tiers.md`](../melee-armour-tiers.md)

## Category Index

> **Counts are intentionally not hand-maintained in this index.** Navigate to the leaf documents for authoritative item tables.

| Category | Doc | Status | What is inside |
|----------|-----|--------|----------------|
| **Weapons** | [`weapons/00-index.md`](weapons/00-index.md) | Complete | Melee, ranged, thrown, magic weapons |
| **Armour** | [`armour/00-index.md`](armour/00-index.md) | Complete | All armour slots (melee + ranged + magic) |
| **Consumables** | [`consumables/00-index.md`](consumables/00-index.md) | Complete | Food, potions |
| **Resources** | [`resources/00-index.md`](resources/00-index.md) | Complete | Wood, ore, fish, crafting |
| **Tools** | [`tools/00-index.md`](tools/00-index.md) | Complete | Gathering, crafting tools |
| **Skill Utility Substrate** | [`../tools-and-intermediates/00-index.md`](../tools-and-intermediates/00-index.md) | Draft | Tools, intermediates, containers, stations |
| **Quest Items** | [`quest/00-index.md`](quest/00-index.md) | Complete | Quest-specific items |
| **Miscellaneous** | [`misc/00-index.md`](misc/00-index.md) | Complete | Currency, ammo, bead pouches |
| **Accessories** | [`accessories/00-index.md`](accessories/00-index.md) | Complete | Capes, amulets, rings, charms, belts, trophies |
| **Economy** | [`../economy/00-index.md`](../economy/00-index.md) | Draft | Value bands, shop stock, services, sinks |

## Item ID Format

All items use kebab-case IDs:

```
{tier}_{family}          // weapons, armour
{material}_{type}        // resources
{descriptor}_{type}      // consumables, tools
{quest}_{item}           // quest items
```

Examples: `pennywrought_shortblade`, `oak_log`, `health_potion`, `smoke_over_old_town_baker_key`

## Equipment Slots

### Melee Armour Slots

| Slot | Base Name | Notes |
|------|-----------|-------|
| Head (light) | **Helm** | Open-faced |
| Head (heavy) | **Greathelm** | Full-face, enclosed |
| Chest (plate) | **Harness** | Breastplate |
| Chest (chain) | **Hauberk** | Chain mail |
| Chest (heavy) | **Platecoat** | Full plate torso |
| Shield | **Ward** | The ownable term for shield |
| Legs | **Chausses** | Historical leg armour |
| Feet | **Sabatons** | Armoured boots |
| Hands | **Gauntlets** | Armoured gloves |

### Magic Armour Slots

| Slot | Base Name | Notes |
|------|-----------|-------|
| Head | **Cowl** | Cloth hood, magic bonus |
| Chest | **Robe** | Cloth torso, magic bonus |
| Off-hand | **Charmward** | Defensive charm-board, warding focus |
| Legs | **Wraps** | Cloth legs, magic bonus |
| Feet | **Softshoes** | Cloth boots, magic bonus |
| Hands | **Cuffs** | Cloth gloves, magic bonus |

### Ranged Armour Slots

| Slot | Base Name | Notes |
|------|-----------|-------|
| Head | **Coif** | Cloth hood, ranged accuracy |
| Chest | **Jerkin** | Light torso, ranged defence |
| Off-hand | **Buckler** | Small shield, ranged defence |
| Legs | **Chaps** | Leg coverings, mobility |
| Feet | **Treads** | Soft boots, stealth, speed |
| Hands | **Vambraces** | Arm guards, ranged accuracy |

### Accessories

| Slot | Base Name | Notes |
|------|-----------|-------|
| Cape | **Cape** | Back slot, visible identity + speed/defence tradeoffs |
| Amulet | **Amulet** | Neck slot, belief and focus, magic/prayer bonuses |
| Ring | **Ring** | Two ring slots, single-stat commitment |
| Charm | **Charm** | Pocket slot, luck and utility, drop rate bonuses |
| Belt | **Belt** | Waist slot, preparation and inventory, ammo/carry bonuses |
| Trophy | **Trophy** | Badge slot, history and specialization, boss bonuses |

**Full accessory documentation:** [`accessories/00-index.md`](accessories/00-index.md)

## Inventory Size

**28 slots** — classic-inspired.

## Stackable vs Non-Stackable

| Stackable | Non-Stackable |
|-----------|---------------|
| Coins | Weapons |
| Beads | Armour |
| Arrows/Bolts | Tools |
| Logs | Quest items (most) |
| Ore | Staves |
| Fish (raw/cooked) | Jewellery |
| Potions | — |
| Food | — |
| Crafting materials | — |

## Item Count Summary

> **This index is navigational; item tables in leaf documents are authoritative.** Counts are not hand-maintained here because they change as content is added.

| Category | Structure | Notes |
|----------|-----------|-------|
| Melee weapons | 12 families × 13 tiers | See [`weapons/melee.md`](weapons/melee.md) |
| Ranged weapons | 14 families × 13 tiers | See [`weapons/ranged.md`](weapons/ranged.md) |
| Thrown weapons | 4 families × 13 tiers | See [`weapons/knives.md`](weapons/knives.md), [`weapons/darts.md`](weapons/darts.md), [`weapons/javelins.md`](weapons/javelins.md), [`weapons/throwing-axes.md`](weapons/throwing-axes.md) |
| Magic weapons | 6 families × 13 tiers | See [`weapons/magic.md`](weapons/magic.md) |
| Melee armour | 9 slots × 13 tiers | See [`armour/00-index.md`](armour/00-index.md) |
| Ranged armour | 6 slots × 13 tiers | See [`armour/00-index.md`](armour/00-index.md) |
| Magic armour | 6 slots × 13 tiers | See [`armour/00-index.md`](armour/00-index.md) |
| Consumables | Food + potions | See [`consumables/00-index.md`](consumables/00-index.md) |
| Resources | Wood, ore, fish, crafting | See [`resources/00-index.md`](resources/00-index.md) |
| Tools | Gathering + crafting | See [`tools/00-index.md`](tools/00-index.md) |
| Skill utility substrate | Tools, intermediates, containers, stations | See [`../tools-and-intermediates/00-index.md`](../tools-and-intermediates/00-index.md) |
| Quest items | Per-quest | See [`quest/00-index.md`](quest/00-index.md) |
| Currency | Coins, quest points | See [`misc/currency.md`](misc/currency.md) |
| Ammunition | 9 types × 13 tiers | See [`misc/ammunition.md`](misc/ammunition.md) |
| Bead pouches | 5 tiers | See [`misc/bead-pouches.md`](misc/bead-pouches.md) |
| Accessories | 6 slots × 13 tiers | See [`accessories/00-index.md`](accessories/00-index.md) |
| Economy | Value bands, shops, services | See [`../economy/00-index.md`](../economy/00-index.md) |

## Design Rules for Adding Items

1. **Never use generic fantasy names.** No "Bronze Sword," "Iron Dagger," etc.
2. **Tiers are cultural.** The name implies a story. Pig Iron is crude. Bellmetal is warm.
3. **Families are reusable.** A "Shortblade" is always a one-handed sword.
4. **Visual identity must be readable.** Full Bellmetal = golden. Full Blackbar = dark.
5. **Cobbled is the joke.** It should look like garbage and have terrible stats.
6. **Starfall is the mythic.** It should feel like a different material category.
7. **Shorthand must be natural.** "Full penny," "warden set," "starfall glaive."
8. **Quest items use quest prefix.** `smoke_over_old_town_baker_key`, not `baker_key`.
9. **Resources use material_type.** `oak_log`, `iron_ore`, not `log_oak`.
10. **Consumables use effect_type.** `health_potion`, `cooked_fish`, not `potion_health`.

## Related Documents

- [`melee-armour-tiers.md`](../melee-armour-tiers.md) — Melee tier system philosophy and naming conventions
- [`ranged-tiers.md`](../ranged-tiers.md) — Ranged tier system philosophy and naming conventions
- [`magic-tiers.md`](../magic-tiers.md) — Magic tier system philosophy and naming conventions
- [`../economy/currency-and-value-bands.md`](../economy/currency-and-value-bands.md) — Item value bands
- [`../../POC_SPEC.md`](../../POC_SPEC.md) §13 (Combat), §16 (Items, inventory, equipment)
- `content/items/` — Actual JSON definitions (populated as stories land)

---

*Last updated: 2026-05-30*

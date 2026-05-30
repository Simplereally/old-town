---
doc_type: item_family
canonical_path: docs/items/accessories/trophies.md
parent_index: docs/items/accessories/00-index.md
system_index: docs/items/00-index.md
root_index: docs/00-index.md
---

# Trophies

> **Trophy slot documentation for Old Town.** Trophies are wall-mounts worn — proof of survival, trophies of conquest, and badges of honour. A Trophy tells the world what you have survived.
>
> **Rule:** Every Trophy has a tradeoff. No Trophy is universally best. Choose the Trophy that matches your history, not the one with the highest numbers.

Parent: [`Accessories Index`](00-index.md)

Authority references:
- `docs/accessory-tiers.md`
- `docs/combat/signature-mechanics.md`
- `docs/combat/mechanics-implementation.md`

## Trophy Philosophy

Trophies are the slot for **history and bragging rights**. They are the objects that prove you killed the dragon, survived the siege, or found the meteor. Trophies are rare, earned, and deeply personal.

**Design principles:**
1. **Trophies are earned, not bought.** Every Trophy requires a specific achievement, kill, or discovery.
2. **Trophies trade boss power for normal power.** Trophies that boost boss damage reduce normal damage. Trophies that boost normal damage are weaker against bosses.
3. **Trophies are rare.** Not every player will have a Trophy. They are the endgame of accessories.
4. **Trophies have PvP caps.** No Trophy bonus exceeds 15% in PvP.

## The 13 Trophy Bands

| Band | Item Name | Role | Acquisition | Tradeoff | Supported Playstyles |
|------|-----------|------|-------------|----------|---------------------|
| **Cobbled** | Ratcatcher Tail | Starter trophy | Kill 10 rats | +1% damage vs. small monsters, -1% vs. large | Beginner, slayer |
| **Threadbare** | Chimney Imp Horn | Imp slayer | Kill 10 chimney imps | +2% damage vs. imps, -2% vs. other monsters | Imp hunting, early game |
| **Waxed** | Tallow Drake Scale | Drake slayer | Kill 5 tallow drakes | +3% damage vs. drakes, -3% vs. other monsters | Drake hunting, fire areas |
| **Bellstruck** | Bell Boar Tusk | Boar slayer | Kill 10 bell boars | +4% damage vs. boars, -4% vs. other monsters | Boar hunting, town areas |
| **Blacksealed** | Blackbar Brand | Bandit slayer | Kill 20 blacksealed bandits | +5% damage vs. bandits, -5% vs. other monsters | Bandit hunting, PvE |
| **Warden-Issued** | Warden's Broken Badge | Warden slayer | Kill 10 warden deserters | +6% damage vs. deserters, -6% vs. other monsters | Lawful, questing |
| **Greenwold** | Greenwold Antler | Druid slayer | Kill 5 Greenwold druids | +7% damage vs. druids, -7% vs. other monsters | Druid hunting, wilderness |
| **Gravebound** | Gravekeeper's Tooth | Grave slayer | Kill 10 graveyard wights | +8% damage vs. undead, -8% vs. living | Undead hunting, graveyards |
| **Blueglass** | Blueglass Eye | Glassworks slayer | Kill 5 glassworks golems | +9% damage vs. golems, -9% vs. other monsters | Golem hunting, prestige |
| **Carmine** | Carmine Mask | Duelist trophy | Win 100 duels | +10% damage in duels, -10% in group PvP | PvP dueling |
| **Argent** | Argent Saintbone | Saint slayer | Kill 10 argent saints | +11% damage vs. saints, -11% vs. other monsters | Saint hunting, support |
| **Crown** | Crown Lion Pin | Knight slayer | Kill 5 Crown Knights | +12% damage vs. knights, -12% vs. other monsters | Knight hunting, endgame |
| **Starfall** | Starfall Heart-Shard | Meteor survivor | Survive a meteor strike | +13% damage vs. all monsters, -13% damage vs. players | Endgame, PvE |

## Build-Glue: What Trophies Support

Trophies are the slot for **specialization and history**. They support playstyles that focus on specific enemies, bosses, or achievements.

| Playstyle | Best Trophy | Why |
|-----------|-------------|-----|
| **Fast training** | Ratcatcher Tail | +1% damage vs. small monsters, easy to get |
| **High damage** | Carmine Mask | +10% damage in duels |
| **Defensive** | Argent Saintbone | +11% damage vs. saints (for tanking) |
| **PvP** | Carmine Mask | +10% damage in duels |
| **Skilling** | Ratcatcher Tail | +1% damage vs. small monsters, no risk |
| **Magic** | Blueglass Eye | +9% damage vs. golems |
| **All-around** | Starfall Heart-Shard | +13% damage vs. all monsters |
| **Ranged starter** | Ratcatcher Tail | +1% damage vs. small monsters |
| **Ranged heavy** | Starfall Heart-Shard | +13% damage vs. all monsters |
| **Ranged precision** | Blueglass Eye | +9% damage vs. golems |
| **Sabre duelist** | Carmine Mask | +10% damage in duels |
| **Fellaxe boss hunter** | Greenwold Antler | +7% damage vs. druids |
| **Cudgel stagger** | Bell Boar Tusk | +4% damage vs. boars |
| **Maul armour-breaker** | Blackbar Brand | +5% damage vs. bandits |
| **Spear / lawful control** | Warden's Broken Badge | +6% damage vs. deserters |
| **Bow skirmisher** | Greenwold Antler | +7% damage vs. druids |
| **Crossbow tank-buster** | Blueglass Eye | +9% damage vs. golems |
| **Knife fan build** | Carmine Mask | +10% damage in duels |
| **Dart venom build** | Blackbar Brand | +5% damage vs. bandits |
| **Javelin anti-shield** | Warden's Broken Badge | +6% damage vs. deserters |
| **Throwing axe hybrid** | Greenwold Antler | +7% damage vs. druids |
| **Bead economy mage** | Ratcatcher Tail | +1% damage vs. small monsters |
| **Writ utility mage** | Warden's Broken Badge | +6% damage vs. deserters |
| **Grave caster** | Gravekeeper's Tooth | +8% damage vs. undead |
| **Cleanse/support mage** | Argent Saintbone | +11% damage vs. saints |
| **Endgame flex** | Starfall Heart-Shard | +13% damage vs. all monsters |

## PvP Cap Warnings

| Trophy | PvP Bonus | PvP Penalty | Cap Status |
|--------|-----------|-------------|------------|
| Carmine Mask | +10% damage in duels | -10% in group PvP | At 15% cap |
| Starfall Heart-Shard | +13% damage vs. monsters | -13% damage vs. players | At 15% cap |

**Warning:** The Carmine Mask and Starfall Heart-Shard are at the 15% PvP cap. They are the maximum PvP power available in the Trophy slot. No future Trophy may exceed these values in PvP.

**Note:** Most Trophies have no PvP bonus because they are PvE specialization items. The tradeoff is that they reduce damage against non-target monsters. This makes Trophies the slot for PvE focus.

## Design Rules for Trophies

1. **Trophies are earned.** The name and description must evoke a specific kill, achievement, or discovery.
2. **Trophies trade boss power for normal power.** Trophies that boost boss damage reduce normal damage. Trophies that boost normal damage are weaker against bosses.
3. **Trophies are rare.** Not every player will have a Trophy. They are the endgame of accessories.
4. **Trophies have PvP caps.** No Trophy bonus exceeds 15% in PvP.
5. **Trophies are cultural.** The Warden's Broken Badge references guard deserters. The Starfall Heart-Shard references meteor strikes.
6. **Trophies are not cosmetics.** A "Trophy" in Old Town is a proof of kill, a badge of honour, a shard of survival. The word "trophy" is the slot name. The item names are more specific.

## Related Documents

- [`00-index.md`](00-index.md) — Accessory slot overview
- [`capes.md`](capes.md) — Cape slot documentation
- [`amulets.md`](amulets.md) — Amulet slot documentation
- [`rings.md`](rings.md) — Ring slot documentation
- [`charms.md`](charms.md) — Charm slot documentation
- [`belts.md`](belts.md) — Belt slot documentation

---

*Total Trophies defined: 13 (one per band)*
*Total Trophies planned: 13 (complete)*

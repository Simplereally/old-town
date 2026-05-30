---
doc_type: item_family
canonical_path: docs/items/accessories/capes.md
parent_index: docs/items/accessories/00-index.md
system_index: docs/items/00-index.md
root_index: docs/00-index.md
---

# Capes

> **Cape slot documentation for Old Town.** Capes are back-cloths — visible, dramatic, and declarative. A Cape tells the world what you value before you draw a weapon.
>
> **Rule:** Every Cape has a tradeoff. No Cape is universally best. Choose the Cape that matches your playstyle, not the one with the highest numbers.

Parent: [`Accessories Index`](00-index.md)

Authority references:
- `docs/accessory-tiers.md`
- `docs/combat/signature-mechanics.md`
- `docs/combat/mechanics-implementation.md`

## Cape Philosophy

Capes are the most visible accessory. Other players see your Cape constantly. This makes Capes social objects as much as mechanical ones.

**Design principles:**
1. **Capes are visible identity.** A Cape says "I am a warden" or "I am a grave-touched wanderer" or "I am a market trader who bought the best."
2. **Capes trade speed for defence.** Fast Capes are fragile. Tough Capes are slow.
3. **Capes amplify sets.** Many Capes provide bonuses when paired with armour of the same band.
4. **Capes have PvP caps.** No Cape bonus exceeds 15% in PvP.

## The 13 Cape Bands

| Band | Item Name | Role | Acquisition | Tradeoff | Supported Playstyles |
|------|-----------|------|-------------|----------|---------------------|
| **Cobbled** | Ragged Cape | Starter visibility | Dropped by tutorial rats | +2 defence, -1% run energy | Beginner, skilling |
| **Threadbare** | Threadbare Cape | Inherited warmth | Given by village elder at start | +3 defence, +1% skilling XP, -2% combat XP | Skilling, early game |
| **Waxed** | Waxed Cape | Weatherproof traveller | Crafted (Wax + Cloth, level 5 Crafting) | +4 defence, +5% rain resistance, -1% magic accuracy | Gathering, travel |
| **Bellstruck** | Bellkeeper Cloak | Town-respected | Bought from Bell Tower keeper (500 coins) | +5 defence, +1% prayer, -1% ranged accuracy | Melee, prayer |
| **Blacksealed** | Blacksealed Mantle | PvP intimidation | Dropped by blacksealed bandits | +6 defence, +2% melee speed in PvP, -3% magic defence | PvP, melee |
| **Warden-Issued** | Warden Cape | Guard-aligned | Reward from Warden quest line | +7 defence, +2% accuracy vs. criminals, -2% vs. beasts | Lawful, questing |
| **Greenwold** | Greenwold Cloak | Forest-touched | Dropped by Greenwold druids | +8 defence, +3% ranged accuracy in forests, -2% melee accuracy in towns | Ranged, wilderness |
| **Gravebound** | Graveshroud | Death-touched | Crafted (Gravecloth + Ash, level 40 Crafting) | +9 defence, +3% magic accuracy vs. undead, -3% vs. living | Magic, undead hunting |
| **Blueglass** | Blueglass Cape | Prestige mage | Bought from Glassworks merchant (10,000 coins) | +10 defence, +4% magic accuracy, -4% melee speed | Magic, prestige |
| **Carmine** | Carmine Duelist Cape | War-tested duelist | Reward from 100 PvP kills | +11 defence, +5% melee speed in duels, -5% defence in group PvP | PvP dueling |
| **Argent** | Argent Cape | Noble protector | Reward from Argent quest line | +12 defence, +3% defence for nearby allies, -3% personal damage | Support, tanking |
| **Crown** | Crownmantle | Royal herald | Dropped by Crown Knights | +13 defence, +4% all accuracy, -4% run energy | All-rounder, endgame |
| **Starfall** | Starfall Cape | Mythic wanderer | Found at meteor strike sites (rare) | +14 defence, +5% all accuracy, -5% HP regeneration | Endgame, collector |

## Build-Glue: What Capes Support

Capes are the slot for **visible commitment**. They support playstyles that want to be seen and recognized.

| Playstyle | Best Cape | Why |
|-----------|-----------|-----|
| **Fast training** | Threadbare Cape | +1% skilling XP, cheap, no risk |
| **High damage** | Carmine Duelist Cape | +5% melee speed in duels |
| **Defensive** | Argent Cape | +3% defence for nearby allies |
| **PvP** | Blacksealed Mantle | +2% melee speed in PvP, intimidating look |
| **Skilling** | Waxed Cape | +5% rain resistance, weatherproof |
| **Magic** | Blueglass Cape | +4% magic accuracy, prestige look |
| **All-around** | Crownmantle | +4% all accuracy, balanced tradeoff |
| **Ranged starter** | Greenwold Cloak | +3% ranged accuracy in forests |
| **Ranged heavy** | Starfall Cape | +5% all accuracy, endgame |
| **Ranged precision** | Blueglass Cape | +4% magic accuracy (for magic ranged) |
| **Sabre duelist** | Carmine Duelist Cape | +5% melee speed in duels |
| **Fellaxe boss hunter** | Greenwold Cloak | +3% ranged accuracy in forests |
| **Cudgel stagger** | Bellkeeper Cloak | +4% magic accuracy, +1% prayer |
| **Maul armour-breaker** | Blacksealed Mantle | +6% defence, +2% melee speed in PvP |
| **Spear / lawful control** | Warden Cape | +7% defence, +2% accuracy vs. criminals |
| **Bow skirmisher** | Greenwold Cloak | +3% ranged accuracy in forests |
| **Crossbow tank-buster** | Blueglass Cape | +10% defence, +4% magic accuracy |
| **Knife fan build** | Carmine Duelist Cape | +5% melee speed in duels |
| **Dart venom build** | Blacksealed Mantle | +6% defence, +2% melee speed in PvP |
| **Javelin anti-shield** | Warden Cape | +7% defence, +2% accuracy vs. criminals |
| **Throwing axe hybrid** | Greenwold Cloak | +3% ranged accuracy in forests |
| **Bead economy mage** | Threadbare Cape | +3% defence, +1% skilling XP |
| **Writ utility mage** | Warden Cape | +7% defence, +2% accuracy vs. criminals |
| **Grave caster** | Graveshroud | +9% defence, +3% magic accuracy vs. undead |
| **Cleanse/support mage** | Argent Cape | +12% defence, +3% defence for nearby allies |
| **Endgame flex** | Starfall Cape | +14% defence, +5% all accuracy |

## PvP Cap Warnings

| Cape | PvP Bonus | PvP Penalty | Cap Status |
|------|-----------|-------------|------------|
| Blacksealed Mantle | +2% melee speed | -3% magic defence | Within 15% cap |
| Carmine Duelist Cape | +5% melee speed | -5% defence in group PvP | At 15% cap |
| Argent Cape | +3% defence for allies | -3% personal damage | Within 15% cap |
| Crownmantle | +4% all accuracy | -4% run energy | Within 15% cap |
| Starfall Cape | +5% all accuracy | -5% HP regeneration | At 15% cap |

**Warning:** The Carmine Duelist Cape and Starfall Cape are at the 15% PvP cap. They are the maximum PvP power available in the Cape slot. No future Cape may exceed these values in PvP.

## Design Rules for Capes

1. **Capes are visible.** The name and description must evoke an object that moves, flows, and catches light.
2. **Capes trade speed for defence.** Fast Capes are fragile. Tough Capes are slow.
3. **Capes amplify sets.** Many Capes provide bonuses when paired with armour of the same band.
4. **Capes have PvP caps.** No Cape bonus exceeds 15% in PvP.
5. **Capes are cultural.** The Bellkeeper Cloak references the town bell tower. The Graveshroud references the old graveyard.
6. **Capes are not capes in the generic sense.** A "Cape" in Old Town is a back-cloth, a mantle, a shroud, a cloak. The word "cape" is the slot name. The item names are more specific.

## Related Documents

- [`00-index.md`](00-index.md) — Accessory slot overview
- [`amulets.md`](amulets.md) — Amulet slot documentation
- [`rings.md`](rings.md) — Ring slot documentation
- [`charms.md`](charms.md) — Charm slot documentation
- [`belts.md`](belts.md) — Belt slot documentation
- [`trophies.md`](trophies.md) — Trophy slot documentation

---

*Total Capes defined: 13 (one per band)*
*Total Capes planned: 13 (complete)*

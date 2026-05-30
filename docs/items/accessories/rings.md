---
doc_type: item_family
canonical_path: docs/items/accessories/rings.md
parent_index: docs/items/accessories/00-index.md
system_index: docs/items/00-index.md
root_index: docs/00-index.md
---

# Rings

> **Ring slot documentation for Old Town.** Rings are finger-binds — small, heavy, and absolute. A Ring is a commitment you wear.
>
> **Rule:** Every Ring has a tradeoff. No Ring is universally best. Choose the Ring that matches your focus, not the one with the highest numbers.

Parent: [`Accessories Index`](00-index.md)

Authority references:
- `docs/accessory-tiers.md`
- `docs/combat/signature-mechanics.md`
- `docs/combat/mechanics-implementation.md`

## Ring Philosophy

Rings are the slot for **single-stat commitment**. They are small, focused, and intense. A Ring does one thing very well and one thing very badly.

**Design principles:**
1. **Rings are commitments.** A Ring is not decoration. It is a promise, a seal, a signet.
2. **Rings are single-stat.** Each Ring boosts one stat significantly and reduces another.
3. **Rings have two slots.** Left and right ring slots. Two different Rings, or one Ring in each.
4. **Rings have PvP caps.** No Ring bonus exceeds 15% in PvP.

## The 13 Ring Bands

| Band | Item Name | Role | Acquisition | Tradeoff | Supported Playstyles |
|------|-----------|------|-------------|----------|---------------------|
| **Cobbled** | Bent Nail Ring | Starter commitment | Dropped by tutorial rats | +1 Strength, -1 Magic | Beginner, melee |
| **Threadbare** | Copper Thread Ring | Inherited focus | Given by village elder at start | +2 Strength, -2 Ranged | Melee, early game |
| **Waxed** | Candlewick Ring | Crafted focus | Crafted (Wax + Copper, level 5 Crafting) | +3 Strength, +5% fire resistance, -3 Magic | Melee, fire areas |
| **Bellstruck** | Bellfounder's Ring | Town-forged | Bought from Bell Tower keeper (500 coins) | +4 Strength, +1% prayer, -4 Ranged | Melee, prayer |
| **Blacksealed** | Blackbar Ring | PvP aggression | Dropped by blacksealed bandits | +5 Strength, +2% melee damage in PvP, -5 Magic defence | PvP, melee |
| **Warden-Issued** | Warden Signet | Guard discipline | Reward from Warden quest line | +6 Strength, +2% accuracy vs. criminals, -6 vs. beasts | Lawful, questing |
| **Greenwold** | Greenwold Ring | Forest strength | Dropped by Greenwold druids | +7 Strength, +3% melee accuracy in forests, -4 Magic in towns | Melee, wilderness |
| **Gravebound** | Graveside Ring | Death focus | Crafted (Grave iron + Bone, level 40 Crafting) | +8 Strength, +3% melee accuracy vs. undead, -5 vs. living | Melee, undead hunting |
| **Blueglass** | Blueglass Lens Ring | Prestige focus | Bought from Glassworks merchant (10,000 coins) | +9 Strength, +4% ranged accuracy, -6 melee speed | Ranged, prestige |
| **Carmine** | Carmine Duelist Ring | War-tested | Reward from 100 PvP kills | +10 Strength, +5% melee damage in duels, -7 defence in group PvP | PvP dueling, melee |
| **Argent** | Argent Mercy Ring | Noble mercy | Reward from Argent quest line | +11 Strength, +3% healing received, -8 personal damage | Support, tanking |
| **Crown** | Crown Signet | Royal authority | Dropped by Crown Knights | +12 Strength, +4% all accuracy, -9 run energy | All-rounder, endgame |
| **Starfall** | Starfall Ring | Mythic power | Found at meteor strike sites (rare) | +13 Strength, +5% all accuracy, -10 HP regeneration | Endgame, collector |

## Build-Glue: What Rings Support

Rings are the slot for **single-stat obsession**. They support playstyles that want to maximize one thing.

| Playstyle | Best Ring | Why |
|-----------|-----------|-----|
| **Fast training** | Copper Thread Ring | +2 Strength, cheap, no risk |
| **High damage** | Carmine Duelist Ring | +5% melee damage in duels |
| **Defensive** | Argent Mercy Ring | +3% healing received |
| **PvP** | Blackbar Ring | +2% melee damage in PvP |
| **Skilling** | Candlewick Ring | +5% fire resistance, safe skilling |
| **Magic** | Blueglass Lens Ring | +4% ranged accuracy (for magic hybrid) |
| **All-around** | Crown Signet | +4% all accuracy, balanced tradeoff |
| **Ranged starter** | Blueglass Lens Ring | +4% ranged accuracy |
| **Ranged heavy** | Starfall Ring | +5% all accuracy, endgame |
| **Ranged precision** | Blueglass Lens Ring | +4% ranged accuracy |
| **Sabre duelist** | Carmine Duelist Ring | +10% Strength, +5% melee damage in duels |
| **Fellaxe boss hunter** | Greenwold Ring | +7% Strength, +3% melee accuracy in forests |
| **Cudgel stagger** | Bellfounder's Ring | +4% Strength, +1% prayer |
| **Maul armour-breaker** | Blackbar Ring | +5% Strength, +2% melee damage in PvP |
| **Spear / lawful control** | Warden Signet | +6% Strength, +2% accuracy vs. criminals |
| **Bow skirmisher** | Greenwold Ring | +7% Strength, +3% melee accuracy in forests |
| **Crossbow tank-buster** | Blueglass Lens Ring | +9% Strength, +4% ranged accuracy |
| **Knife fan build** | Carmine Duelist Ring | +10% Strength, +5% melee damage in duels |
| **Dart venom build** | Blackbar Ring | +5% Strength, +2% melee damage in PvP |
| **Javelin anti-shield** | Blueglass Lens Ring | +9% Strength, +4% ranged accuracy |
| **Throwing axe hybrid** | Blackbar Ring | +5% Strength, +2% melee damage in PvP |
| **Bead economy mage** | Copper Thread Ring | +2% Strength, cheap |
| **Writ utility mage** | Warden Signet | +6% Strength, +2% accuracy vs. criminals |
| **Grave caster** | Graveside Ring | +8% Strength, +3% melee accuracy vs. undead |
| **Cleanse/support mage** | Argent Mercy Ring | +11% Strength, +3% healing received |
| **Endgame flex** | Starfall Ring | +13% Strength, +5% all accuracy |

## PvP Cap Warnings

| Ring | PvP Bonus | PvP Penalty | Cap Status |
|------|-----------|-------------|------------|
| Blackbar Ring | +2% melee damage | -5% Magic defence | Within 15% cap |
| Carmine Duelist Ring | +5% melee damage | -7% defence in group PvP | At 15% cap |
| Argent Mercy Ring | +3% healing received | -8% personal damage | Within 15% cap |
| Crown Signet | +4% all accuracy | -9% run energy | Within 15% cap |
| Starfall Ring | +5% all accuracy | -10% HP regeneration | At 15% cap |

**Warning:** The Carmine Duelist Ring and Starfall Ring are at the 15% PvP cap. They are the maximum PvP power available in the Ring slot. No future Ring may exceed these values in PvP.

## Design Rules for Rings

1. **Rings are commitments.** The name and description must evoke a promise, a seal, or a signet.
2. **Rings are single-stat.** Each Ring boosts one stat significantly and reduces another.
3. **Rings have two slots.** Left and right ring slots. Two different Rings, or one Ring in each.
4. **Rings have PvP caps.** No Ring bonus exceeds 15% in PvP.
5. **Rings are cultural.** The Bellfounder's Ring references the bell-foundry guild. The Warden Signet references guard authority.
6. **Rings are not jewellery.** A "Ring" in Old Town is a bind, a seal, a signet. The word "ring" is the slot name. The item names are more specific.

## Related Documents

- [`00-index.md`](00-index.md) — Accessory slot overview
- [`capes.md`](capes.md) — Cape slot documentation
- [`amulets.md`](amulets.md) — Amulet slot documentation
- [`charms.md`](charms.md) — Charm slot documentation
- [`belts.md`](belts.md) — Belt slot documentation
- [`trophies.md`](trophies.md) — Trophy slot documentation

---

*Total Rings defined: 13 (one per band)*
*Total Rings planned: 13 (complete)*

# Melee Weapon and Armour Tier System

> **Design authority:** This document is the canonical reference for all melee weapon and armour tiers in Old Town. Content definitions in `content/items/` must follow these naming conventions. `POC_SPEC.md` wins if any technical detail conflicts; this document wins on naming, flavor, and tier identity.

## Philosophy

Old Town avoids generic fantasy metals. Instead of "Bronze → Iron → Steel → Mithril → Adamant → Rune", the progression tells a story about the world, its economy, and the player’s journey from a nobody to a legend.

**Pennywrought** is the canonical starter tier. It is not a downgrade of copper or bronze. It is a specific cultural object: cheap, locally-forged, slightly pathetic, but lovable. Players will call it **"penny"**.

## The Tier Ladder

| Order | Tier name | Shorthand | Visual identity | Progression meaning |
|------|-----------|-----------|-----------------|-------------------|
| 0 | **Cobbled** | cobbled | Wood, straps, nails, chipped iron | Tutorial trash, improvised street gear |
| 1 | **Pennywrought** | penny | Dull copper-brown metal, cheap rivets, rope grips | First real melee tier |
| 2 | **Pig Iron** | pig | Dark crude iron, heavy heads, blunt edges | Stronger, ugly, practical |
| 3 | **Bellmetal** | bell | Brass/gold alloy, warm shine, town-forged | First desirable low-tier set |
| 4 | **Blackbar** | bar | Blackened iron, old gate/prison-bar look | Early PvP / aggressive set |
| 5 | **Wardensteel** | warden | Steel with blue/white town-guard trim | Disciplined mid-tier baseline |
| 6 | **Greenwold** | greenwold | Green enamel, forest metal, vine etching | Ranger/wilderness-adjacent melee |
| 7 | **Graveiron** | grave | Charcoal steel, bone-white accents | Crypt/dungeon tier |
| 8 | **Blueglass** | blueglass | Blue inlays, polished steel, glassy gems | First magical-metal prestige tier |
| 9 | **Carmine Steel** | carmine | Red lacquer, black leather, silver edges | High-damage, duelist/war tier |
| 10 | **Argent** | argent | Bright silver, clean highlights, noble trim | Elite knightly tier |
| 11 | **Crownsteel** | crown | Gold edging, white/silver plates, heraldic | Royal/endgame-readable tier |
| 12 | **Starfall** | starfall | Dark steel, pale highlights, meteor flecks | Mythic top-tier material |

## Weapon Naming Conventions

The weapon family name comes first, then the tier.

Format: `{Tier} {WeaponBase}`

| Weapon family | Description | Ownable examples |
|--------------|-------------|------------------|
| **Sticker** | Dagger, small blade, easily concealed | Pennywrought Sticker, Bellmetal Sticker |
| **Shortblade** | Short sword, one-handed, versatile | Pennywrought Shortblade, Wardensteel Shortblade |
| **Longblade** | Long sword, one-handed, reach | Pig Iron Longblade, Argent Longblade |
| **Greatblade** | Two-handed sword, heavy | Graveiron Greatblade, Starfall Greatblade |
| **Sabre** | Curved sword, slashing, stylish | Carmine Steel Sabre, Blackbar Sabre |
| **Handaxe** | One-handed axe, tool and weapon | Pig Iron Handaxe, Greenwold Handaxe |
| **Fellaxe** | Battleaxe, two-handed, brutal | Bellmetal Fellaxe, Graveiron Fellaxe |
| **Cudgel** | Mace, blunt, simple | Cobbled Cudgel, Blackbar Cudgel |
| **Maul** | Warhammer, two-handed, crushing | Crownsteel Maul, Blueglass Maul |
| **Spear** | Polearm, piercing, defensive | Greenwold Spear, Wardensteel Spear |
| **Billhook** | Halberd, hook-and-slash, reach | Blueglass Billhook, Carmine Steel Billhook |
| **Glaive** | Heavy polearm, sweeping, elite | Starfall Glaive, Argent Glaive |

### Memorable names

These are the most grounded and sticky weapon names:
- **Sticker** — sounds dangerous, small, dirty
- **Fellaxe** — "fell" as in "to cut down", brutal
- **Billhook** — historically accurate, agricultural, threatening
- **Maul** — short, heavy, blunt

## Armour Naming Conventions

Avoid RS-era terms like "platebody" unless intentional. Old Town owns its own language.

| Slot | Base name | Description | Example |
|------|-----------|-------------|---------|
| Head (light) | **Helm** | Open-faced, practical | Pennywrought Helm |
| Head (heavy) | **Greathelm** | Full-face, enclosed | Argent Greathelm |
| Chest | **Harness** | Breastplate and backplate | Bellmetal Harness |
| Chest (chain) | **Hauberk** | Chain mail torso | Pig Iron Hauberk |
| Chest (heavy) | **Platecoat** | Full plate torso | Crownsteel Platecoat |
| Shield | **Ward** | The ownable term for shield | Blackbar Ward, Starfall Ward |
| Legs | **Chausses** | Historical leg armour term | Graveiron Chausses |
| Feet | **Sabatons** | Armoured boots | Carmine Steel Sabatons |
| Hands | **Gauntlets** | Armoured gloves | Starfall Gauntlets |

### Why "Ward"?

"Shield" is generic. "Ward" is specific, sounds protective, and pairs beautifully with tier names: "Wardensteel Ward" has alliteration, "Blackbar Ward" sounds intimidating, "Starfall Ward" sounds mythic.

## Starter Progression (First 10 Items)

The new player’s first melee journey should feel like this:

1. **Cobbled Sticker** — first weapon, literally trash
2. **Cobbled Cudgel** — first blunt weapon, also trash
3. **Pennywrought Shortblade** — first real sword, proud moment
4. **Pennywrought Helm** — first head protection
5. **Pennywrought Ward** — first shield, can now block
6. **Pig Iron Longblade** — first upgrade, feels heavy and crude
7. **Pig Iron Hauberk** — first chain mail, audible when walking
8. **Bellmetal Fellaxe** — first two-handed weapon, slow but strong
9. **Bellmetal Harness** — first breastplate, looks like a real fighter
10. **Blackbar Maul** — first PvP-intimidating weapon, black and brutal

## The Full Pennywrought Set (Starter Set)

When a player completes the tutorial and gets their first real gear, they should receive or craft:

- Pennywrought Sticker
- Pennywrought Shortblade
- Pennywrought Handaxe
- Pennywrought Cudgel
- Pennywrought Helm
- Pennywrought Harness
- Pennywrought Ward
- Pennywrought Chausses
- Pennywrought Sabatons
- Pennywrought Gauntlets

Players will call this **"full penny"**. It is the first social milestone.

## Design Rules

1. **Never use "Bronze", "Iron", "Steel", "Mithril", "Adamant", "Rune"** as tier names. These are RuneScape words and do not belong in Old Town.
2. **Tiers are cultural, not just elemental.** Pennywrought is about being cheap and local. Wardensteel is about being disciplined and official. Graveiron is about death and crypts. The name implies a story.
3. **Weapon families are reusable.** A "Fellaxe" is always a battleaxe. A "Ward" is always a shield. The tier changes the material and stats, but the silhouette stays consistent.
4. **Visual identity must be readable at a glance.** A player wearing full Bellmetal should look warm and golden. A player wearing Blackbar should look dark and aggressive. A player with Starfall should look like they fell from the sky.
5. **Shorthand is intentional.** Players will say "penny sword", "full bell", "warden set", "starfall glaive". Design for this language.
6. **Cobbled is not a tier to be proud of.** It is tutorial gear. It should look like literal garbage. Players should want to replace it immediately.
7. **Starfall is not "the best because it is the last."** It is the best because it implies cosmic rarity. It should feel like a different material category, not just "steel but more."

## Content JSON Schema Reference

When defining items in `content/items/weapons.json` and `content/items/armour.json`, use these fields:

```json
{
  "id": "pennywrought_shortblade",
  "name": "Pennywrought Shortblade",
  "tier": "pennywrought",
  "tierOrder": 1,
  "family": "shortblade",
  "slot": "weapon",
  "category": "melee",
  "visualIdentity": {
    "baseColor": "copper-brown",
    "accents": "cheap-rivets",
    "grip": "rope"
  },
  "stats": {
    "attackSpeed": 4,
    "attackRange": 1,
    "bonuses": {
      "stabAttack": 4,
      "slashAttack": 4,
      "crushAttack": 2
    }
  },
  "requirements": {
    "attack": 1
  }
}
```

## Related Documents

- [`ranged-tiers.md`](ranged-tiers.md) — Ranged weapon tier system (shared power ladder, ranged material logic)
- [`ranged-armour-tiers.md`](ranged-armour-tiers.md) — Ranged armour tier system (shared power ladder, hide/cloth material logic)
- [`magic-tiers.md`](magic-tiers.md) — Magic tier system (shared power ladder, bead system, magic material logic)
- [`items/weapons/ranged.md`](items/weapons/ranged.md) — Full ranged weapon inventory
- [`items/weapons/magic.md`](items/weapons/magic.md) — Full magic weapon inventory
- [`items/armour/00-index.md`](items/armour/00-index.md) — Full armour inventory (melee, ranged, magic)
- [`items/misc/ammunition.md`](items/misc/ammunition.md) — Ammunition inventory
- `POC_SPEC.md` §13 (Combat system), §16 (Items, inventory, equipment)
- `content/items/` — actual item definitions (populated as stories land)

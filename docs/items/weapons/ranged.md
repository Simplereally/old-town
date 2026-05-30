# Ranged Weapons

> All ranged weapons in Old Town. 14 weapon families (8 bows + 6 crossbows), each with 13 tiers (0-12). Every weapon follows the ranged tier system defined in [`ranged-tiers.md`](../../ranged-tiers.md).

## Tier System

Bows use organic tier names. Crossbows use metal tier names.

| Order | Bow Tier | Crossbow Tier | Shorthand | Speed Mod | Damage Mod | Range | Weight |
|------|----------|---------------|-----------|-----------|------------|-------|--------|
| 0 | Cobbled | Cobbled | cobbled | +0% | -50% | Short | Light |
| 1 | Lathwood | Pennywrought | lath / penny | +0% | -25% | Short | Light |
| 2 | Bogwood | Pig Iron | bog / pig | -5% | +0% | Medium | Medium |
| 3 | Bellhorn | Bellmetal | bell | +0% | +10% | Medium | Light |
| 4 | Blackstring | Blackbar | blackstring / bar | -10% | +20% | Long | Heavy |
| 5 | Warden Yew | Wardensteel | warden | +5% | +15% | Long | Medium |
| 6 | Greenwold | Greenwold | greenwold | +0% | +10% | Medium | Light |
| 7 | Gravebent | Graveiron | grave | -5% | +25% | Long | Heavy |
| 8 | Blueglass | Blueglass | blueglass | +10% | +15% | Long | Light |
| 9 | Carmine Ash | Carmine Steel | carmine | +0% | +30% | Long | Medium |
| 10 | Argentwood | Argent | argent | +5% | +25% | Long | Medium |
| 11 | Crownhorn | Crownsteel | crown | +0% | +35% | Very Long | Heavy |
| 12 | Starfall | Starfall | starfall | +10% | +40% | Very Long | Light |

**Note:** Speed is measured in ticks (600ms = 1 tick). Range is measured in tiles.

## Bow Families

### Bentbow (Training Bow)

> The weakest bow. Literally bent. Tutorial-only.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Range:** 5 tiles
- **Hands:** 2H
- **Best for:** Tutorial, first ranged experience

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_bentbow` | Cobbled Bentbow | +0 | +0 | Twig with string, basically |
| 1 | `lathwood_bentbow` | Lathwood Bentbow | +2 | +1 | Pale cheap wood, still bent |
| 2 | `bogwood_bentbow` | Bogwood Bentbow | +4 | +2 | Damp dark wood, worse |
| 3 | `bellhorn_bentbow` | Bellhorn Bentbow | +6 | +3 | Horn limbs, too bent to use |
| 4 | `blackstring_bentbow` | Blackstring Bentbow | +8 | +4 | Blackened, tarred, ruined |
| 5 | `warden_yew_bentbow` | Warden Yew Bentbow | +10 | +5 | Guard-issue bent, embarrassing |
| 6 | `greenwold_bentbow` | Greenwold Bentbow | +12 | +6 | Living wood, bent by nature |
| 7 | `gravebent_bentbow` | Gravebent Bentbow | +14 | +7 | Bone-white, bent by death |
| 8 | `blueglass_bentbow` | Blueglass Bentbow | +16 | +8 | Blue crystal, still bent |
| 9 | `carmine_ash_bentbow` | Carmine Ash Bentbow | +18 | +9 | Red lacquered, bent ash |
| 10 | `argentwood_bentbow` | Argentwood Bentbow | +20 | +10 | Silver wood, noble bent |
| 11 | `crownhorn_bentbow` | Crownhorn Bentbow | +22 | +11 | Gold horn, royal bent |
| 12 | `starfall_bentbow` | Starfall Bentbow | +24 | +12 | Meteor bent, mythic trash |

### Shortbow

> The standard bow. Fast, light, versatile. The canonical starter bow.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Range:** 6 tiles
- **Hands:** 2H
- **Best for:** All-around ranged combat, early training, first real bow

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_shortbow` | Cobbled Shortbow | +0 | +0 | Short plank, short string |
| 1 | `lathwood_shortbow` | Lathwood Shortbow | +3 | +2 | Canonical starter bow |
| 2 | `bogwood_shortbow` | Bogwood Shortbow | +6 | +4 | Dark damp wood, short |
| 3 | `bellhorn_shortbow` | Bellhorn Shortbow | +9 | +6 | Horn shortbow, town-forged |
| 4 | `blackstring_shortbow` | Blackstring Shortbow | +12 | +8 | Blackened short, aggressive |
| 5 | `warden_yew_shortbow` | Warden Yew Shortbow | +15 | +10 | Guard short, blue-white |
| 6 | `greenwold_shortbow` | Greenwold Shortbow | +18 | +12 | Green short, forest ranger |
| 7 | `gravebent_shortbow` | Gravebent Shortbow | +21 | +14 | Bone short, crypt-looted |
| 8 | `blueglass_shortbow` | Blueglass Shortbow | +24 | +16 | Blue crystal short, magical |
| 9 | `carmine_ash_shortbow` | Carmine Ash Shortbow | +27 | +18 | Red short, duelist's bow |
| 10 | `argentwood_shortbow` | Argentwood Shortbow | +30 | +20 | Silver short, noble |
| 11 | `crownhorn_shortbow` | Crownhorn Shortbow | +33 | +22 | Gold horn short, royal |
| 12 | `starfall_shortbow` | Starfall Shortbow | +36 | +24 | Meteor short, mythic |

### Longbow

> Slower, longer range, more damage. The standard mid-to-late bow.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 6 ticks
- **Range:** 8 tiles
- **Hands:** 2H
- **Best for:** Mid-level combat, long-range training

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_longbow` | Cobbled Longbow | +0 | +0 | Long stick, too long |
| 1 | `lathwood_longbow` | Lathwood Longbow | +4 | +3 | First long bow, cheap wood |
| 2 | `bogwood_longbow` | Bogwood Longbow | +8 | +6 | Dark long, damp and heavy |
| 3 | `bellhorn_longbow` | Bellhorn Longbow | +12 | +9 | Horn long, golden tips |
| 4 | `blackstring_longbow` | Blackstring Longbow | +16 | +12 | Blackened long, tarred |
| 5 | `warden_yew_longbow` | Warden Yew Longbow | +20 | +15 | Guard long, canonical mid |
| 6 | `greenwold_longbow` | Greenwold Longbow | +24 | +18 | Green long, forest knight |
| 7 | `gravebent_longbow` | Gravebent Longbow | +28 | +21 | Bone long, crypt warden |
| 8 | `blueglass_longbow` | Blueglass Longbow | +32 | +24 | Blue crystal long, magical |
| 9 | `carmine_ash_longbow` | Carmine Ash Longbow | +36 | +27 | Red long, war bow |
| 10 | `argentwood_longbow` | Argentwood Longbow | +40 | +30 | Silver long, paladin |
| 11 | `crownhorn_longbow` | Crownhorn Longbow | +44 | +33 | Gold horn long, royal |
| 12 | `starfall_longbow` | Starfall Longbow | +48 | +36 | Meteor long, mythic |

### Recurve

> Fast, stylish, curved bow. Good for mobile combat.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Range:** 7 tiles
- **Hands:** 2H
- **Best for:** Fast training, stylish combat, mobile ranged

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_recurve` | Cobbled Recurve | +0 | +0 | Bent stick, not curved |
| 1 | `lathwood_recurve` | Lathwood Recurve | +4 | +2 | First curved bow, pale wood |
| 2 | `bogwood_recurve` | Bogwood Recurve | +8 | +4 | Dark damp recurve |
| 3 | `bellhorn_recurve` | Bellhorn Recurve | +12 | +6 | Golden horn recurve, canonical |
| 4 | `blackstring_recurve` | Blackstring Recurve | +16 | +8 | Blackened recurve, aggressive |
| 5 | `warden_yew_recurve` | Warden Yew Recurve | +20 | +10 | Guard recurve, blue-white |
| 6 | `greenwold_recurve` | Greenwold Recurve | +24 | +12 | Green recurve, forest |
| 7 | `gravebent_recurve` | Gravebent Recurve | +28 | +14 | Bone recurve, crypt |
| 8 | `blueglass_recurve` | Blueglass Recurve | +32 | +16 | Blue crystal recurve, magical |
| 9 | `carmine_ash_recurve` | Carmine Ash Recurve | +36 | +18 | Red recurve, war |
| 10 | `argentwood_recurve` | Argentwood Recurve | +40 | +20 | Silver recurve, noble |
| 11 | `crownhorn_recurve` | Crownhorn Recurve | +44 | +22 | Gold horn recurve, royal |
| 12 | `starfall_recurve` | Starfall Recurve | +48 | +24 | Meteor recurve, mythic |

### Warbow

> Heavy bow. Slow, but highest bow damage. Requires both hands.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 7 ticks (slow)
- **Range:** 8 tiles
- **Hands:** 2H
- **Best for:** High damage, killing strong NPCs, PvP burst
- **Tradeoff:** Cannot use shield, slow

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_warbow` | Cobbled Warbow | +0 | +0 | Heavy plank, too heavy |
| 1 | `lathwood_warbow` | Lathwood Warbow | +5 | +4 | First heavy bow, pale wood |
| 2 | `bogwood_warbow` | Bogwood Warbow | +10 | +8 | Dark heavy, damp |
| 3 | `bellhorn_warbow` | Bellhorn Warbow | +15 | +12 | Horn heavy, golden |
| 4 | `blackstring_warbow` | Blackstring Warbow | +20 | +16 | Blackened heavy, canonical |
| 5 | `warden_yew_warbow` | Warden Yew Warbow | +25 | +20 | Guard heavy, blue-white |
| 6 | `greenwold_warbow` | Greenwold Warbow | +30 | +24 | Green heavy, forest |
| 7 | `gravebent_warbow` | Gravebent Warbow | +35 | +28 | Bone heavy, crypt |
| 8 | `blueglass_warbow` | Blueglass Warbow | +40 | +32 | Blue crystal heavy, magical |
| 9 | `carmine_ash_warbow` | Carmine Ash Warbow | +45 | +36 | Red heavy, war champion |
| 10 | `argentwood_warbow` | Argentwood Warbow | +50 | +40 | Silver heavy, holy |
| 11 | `crownhorn_warbow` | Crownhorn Warbow | +55 | +44 | Gold horn heavy, royal |
| 12 | `starfall_warbow` | Starfall Warbow | +60 | +48 | Meteor heavy, mythic |

### Quickbow

> Fastest bow. Very light, short range. Good for rapid training.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 4 ticks (fastest)
- **Range:** 5 tiles
- **Hands:** 2H
- **Best for:** Fast training, rapid fire, low-level skilling

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_quickbow` | Cobbled Quickbow | +0 | +0 | Fast twig, fast miss |
| 1 | `lathwood_quickbow` | Lathwood Quickbow | +3 | +1 | First fast bow, pale wood |
| 2 | `bogwood_quickbow` | Bogwood Quickbow | +6 | +2 | Dark fast, damp |
| 3 | `bellhorn_quickbow` | Bellhorn Quickbow | +9 | +3 | Horn fast, golden |
| 4 | `blackstring_quickbow` | Blackstring Quickbow | +12 | +4 | Blackened fast, aggressive |
| 5 | `warden_yew_quickbow` | Warden Yew Quickbow | +15 | +5 | Guard fast, blue-white |
| 6 | `greenwold_quickbow` | Greenwold Quickbow | +18 | +6 | Green fast, forest, canonical |
| 7 | `gravebent_quickbow` | Gravebent Quickbow | +21 | +7 | Bone fast, crypt |
| 8 | `blueglass_quickbow` | Blueglass Quickbow | +24 | +8 | Blue crystal fast, magical |
| 9 | `carmine_ash_quickbow` | Carmine Ash Quickbow | +27 | +9 | Red fast, war, canonical |
| 10 | `argentwood_quickbow` | Argentwood Quickbow | +30 | +10 | Silver fast, noble |
| 11 | `crownhorn_quickbow` | Crownhorn Quickbow | +33 | +11 | Gold horn fast, royal |
| 12 | `starfall_quickbow` | Starfall Quickbow | +36 | +12 | Meteor fast, mythic |

### Stillbow

> Precision bow. Slow, but very long range and high accuracy.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 6 ticks
- **Range:** 9 tiles
- **Hands:** 2H
- **Best for:** Sniping, long-range combat, precision

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_stillbow` | Cobbled Stillbow | +0 | +0 | Still stick, still bad |
| 1 | `lathwood_stillbow` | Lathwood Stillbow | +4 | +2 | First still bow, pale wood |
| 2 | `bogwood_stillbow` | Bogwood Stillbow | +8 | +4 | Dark still, damp |
| 3 | `bellhorn_stillbow` | Bellhorn Stillbow | +12 | +6 | Horn still, golden |
| 4 | `blackstring_stillbow` | Blackstring Stillbow | +16 | +8 | Blackened still, aggressive |
| 5 | `warden_yew_stillbow` | Warden Yew Stillbow | +20 | +10 | Guard still, blue-white |
| 6 | `greenwold_stillbow` | Greenwold Stillbow | +24 | +12 | Green still, forest |
| 7 | `gravebent_stillbow` | Gravebent Stillbow | +28 | +14 | Bone still, crypt |
| 8 | `blueglass_stillbow` | Blueglass Stillbow | +32 | +16 | Blue crystal still, magical |
| 9 | `carmine_ash_stillbow` | Carmine Ash Stillbow | +36 | +18 | Red still, war |
| 10 | `argentwood_stillbow` | Argentwood Stillbow | +40 | +20 | Silver still, noble, canonical |
| 11 | `crownhorn_stillbow` | Crownhorn Stillbow | +44 | +22 | Gold horn still, royal |
| 12 | `starfall_stillbow` | Starfall Stillbow | +48 | +24 | Meteor still, mythic |

### Starbow

> Mythic bow. The highest ranged damage. Celestial.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Range:** 10 tiles
- **Hands:** 2H
- **Best for:** Endgame, maximum ranged damage, mythic status

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_starbow` | Cobbled Starbow | +0 | +0 | Star-shaped stick, not a star |
| 1 | `lathwood_starbow` | Lathwood Starbow | +6 | +4 | First star bow, pale wood |
| 2 | `bogwood_starbow` | Bogwood Starbow | +12 | +8 | Dark star, damp |
| 3 | `bellhorn_starbow` | Bellhorn Starbow | +18 | +12 | Horn star, golden |
| 4 | `blackstring_starbow` | Blackstring Starbow | +24 | +16 | Blackened star, aggressive |
| 5 | `warden_yew_starbow` | Warden Yew Starbow | +30 | +20 | Guard star, blue-white |
| 6 | `greenwold_starbow` | Greenwold Starbow | +36 | +24 | Green star, forest |
| 7 | `gravebent_starbow` | Gravebent Starbow | +42 | +28 | Bone star, crypt |
| 8 | `blueglass_starbow` | Blueglass Starbow | +48 | +32 | Blue crystal star, magical |
| 9 | `carmine_ash_starbow` | Carmine Ash Starbow | +54 | +36 | Red star, war |
| 10 | `argentwood_starbow` | Argentwood Starbow | +60 | +40 | Silver star, noble |
| 11 | `crownhorn_starbow` | Crownhorn Starbow | +66 | +44 | Gold horn star, royal |
| 12 | `starfall_starbow` | Starfall Starbow | +72 | +48 | Meteor star, mythic, canonical |

## Crossbow Families

### Latchbow (Light Crossbow)

> Light, fast-loading crossbow. The canonical early crossbow.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 6 ticks
- **Range:** 6 tiles
- **Hands:** 2H
- **Best for:** Early crossbow training, light mechanical ranged

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_latchbow` | Cobbled Latchbow | +0 | +0 | Scrap wood, twine latch |
| 1 | `pennywrought_latchbow` | Pennywrought Latchbow | +3 | +2 | Copper latch, first real |
| 2 | `pig_iron_latchbow` | Pig Iron Latchbow | +6 | +4 | Iron latch, crude, canonical |
| 3 | `bellmetal_latchbow` | Bellmetal Latchbow | +9 | +6 | Brass latch, warm |
| 4 | `blackbar_latchbow` | Blackbar Latchbow | +12 | +8 | Black latch, aggressive |
| 5 | `wardensteel_latchbow` | Wardensteel Latchbow | +15 | +10 | Steel latch, guard-issue |
| 6 | `greenwold_latchbow` | Greenwold Latchbow | +18 | +12 | Green latch, forest, canonical |
| 7 | `graveiron_latchbow` | Graveiron Latchbow | +21 | +14 | Dark latch, crypt |
| 8 | `blueglass_latchbow` | Blueglass Latchbow | +24 | +16 | Blue latch, magical |
| 9 | `carmine_steel_latchbow` | Carmine Steel Latchbow | +27 | +18 | Red latch, war |
| 10 | `argent_latchbow` | Argent Latchbow | +30 | +20 | Silver latch, noble |
| 11 | `crownsteel_latchbow` | Crownsteel Latchbow | +33 | +22 | Gold latch, royal |
| 12 | `starfall_latchbow` | Starfall Latchbow | +36 | +24 | Meteor latch, mythic |

### Crossbow (Standard Crossbow)

> The standard crossbow. Slower than bows, but heavy bolts pierce armour.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 7 ticks
- **Range:** 7 tiles
- **Hands:** 2H
- **Best for:** Armour piercing, mid-level ranged

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_crossbow` | Cobbled Crossbow | +0 | +0 | Scrap wood, bent prod |
| 1 | `pennywrought_crossbow` | Pennywrought Crossbow | +4 | +3 | Copper prod, first real |
| 2 | `pig_iron_crossbow` | Pig Iron Crossbow | +8 | +6 | Iron prod, crude |
| 3 | `bellmetal_crossbow` | Bellmetal Crossbow | +12 | +9 | Brass prod, canonical |
| 4 | `blackbar_crossbow` | Blackbar Crossbow | +16 | +12 | Black prod, aggressive |
| 5 | `wardensteel_crossbow` | Wardensteel Crossbow | +20 | +15 | Steel prod, guard-issue |
| 6 | `greenwold_crossbow` | Greenwold Crossbow | +24 | +18 | Green prod, forest |
| 7 | `graveiron_crossbow` | Graveiron Crossbow | +28 | +21 | Dark prod, crypt |
| 8 | `blueglass_crossbow` | Blueglass Crossbow | +32 | +24 | Blue crystal prod, canonical |
| 9 | `carmine_steel_crossbow` | Carmine Steel Crossbow | +36 | +27 | Red prod, war |
| 10 | `argent_crossbow` | Argent Crossbow | +40 | +30 | Silver prod, noble |
| 11 | `crownsteel_crossbow` | Crownsteel Crossbow | +44 | +33 | Gold prod, royal |
| 12 | `starfall_crossbow` | Starfall Crossbow | +48 | +36 | Meteor prod, mythic |

### Arbalest (Heavy Crossbow)

> Heavy crossbow. Slowest, but highest crossbow damage. Devastating.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 8 ticks (slowest crossbow)
- **Range:** 8 tiles
- **Hands:** 2H
- **Best for:** Maximum crossbow damage, killing armoured NPCs, siege

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_arbalest` | Cobbled Arbalest | +0 | +0 | Heavy scrap, barely works |
| 1 | `pennywrought_arbalest` | Pennywrought Arbalest | +5 | +4 | Copper heavy, first real |
| 2 | `pig_iron_arbalest` | Pig Iron Arbalest | +10 | +8 | Iron heavy, crude |
| 3 | `bellmetal_arbalest` | Bellmetal Arbalest | +15 | +12 | Brass heavy, warm |
| 4 | `blackbar_arbalest` | Blackbar Arbalest | +20 | +16 | Black heavy, aggressive |
| 5 | `wardensteel_arbalest` | Wardensteel Arbalest | +25 | +20 | Steel heavy, guard, canonical |
| 6 | `greenwold_arbalest` | Greenwold Arbalest | +30 | +24 | Green heavy, forest |
| 7 | `graveiron_arbalest` | Graveiron Arbalest | +35 | +28 | Dark heavy, crypt, canonical |
| 8 | `blueglass_arbalest` | Blueglass Arbalest | +40 | +32 | Blue crystal heavy, magical |
| 9 | `carmine_steel_arbalest` | Carmine Steel Arbalest | +45 | +36 | Red heavy, war |
| 10 | `argent_arbalest` | Argent Arbalest | +50 | +40 | Silver heavy, noble, canonical |
| 11 | `crownsteel_arbalest` | Crownsteel Arbalest | +55 | +44 | Gold heavy, royal |
| 12 | `starfall_arbalest` | Starfall Arbalest | +60 | +48 | Meteor heavy, canonical |

### Crankbow (Repeating Crossbow)

> Repeating crossbow. Fast reload via crank mechanism. Good for rapid fire.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Range:** 6 tiles
- **Hands:** 2H
- **Best for:** Rapid fire, training, mechanical ranged

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_crankbow` | Cobbled Crankbow | +0 | +0 | Scrap crank, barely turns |
| 1 | `pennywrought_crankbow` | Pennywrought Crankbow | +4 | +2 | Copper crank, first real |
| 2 | `pig_iron_crankbow` | Pig Iron Crankbow | +8 | +4 | Iron crank, crude |
| 3 | `bellmetal_crankbow` | Bellmetal Crankbow | +12 | +6 | Brass crank, warm |
| 4 | `blackbar_crankbow` | Blackbar Crankbow | +16 | +8 | Black crank, aggressive, canonical |
| 5 | `wardensteel_crankbow` | Wardensteel Crankbow | +20 | +10 | Steel crank, guard |
| 6 | `greenwold_crankbow` | Greenwold Crankbow | +24 | +12 | Green crank, forest |
| 7 | `graveiron_crankbow` | Graveiron Crankbow | +28 | +14 | Dark crank, crypt |
| 8 | `blueglass_crankbow` | Blueglass Crankbow | +32 | +16 | Blue crystal crank, magical |
| 9 | `carmine_steel_crankbow` | Carmine Steel Crankbow | +36 | +18 | Red crank, war |
| 10 | `argent_crankbow` | Argent Crankbow | +40 | +20 | Silver crank, noble |
| 11 | `crownsteel_crankbow` | Crownsteel Crankbow | +44 | +22 | Gold crank, royal |
| 12 | `starfall_crankbow` | Starfall Crankbow | +48 | +24 | Meteor crank, mythic |

### Handbow (Compact Crossbow)

> One-handed crossbow. Compact, can be used with a shield or off-hand item.

- **Slot:** Weapon (one-handed)
- **Attack speed:** 6 ticks
- **Range:** 5 tiles
- **Hands:** 1H
- **Best for:** One-handed ranged, shield combos, compact combat
- **Tradeoff:** Lower damage than two-handed crossbows

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_handbow` | Cobbled Handbow | +0 | +0 | Scrap hand-size, dangerous |
| 1 | `pennywrought_handbow` | Pennywrought Handbow | +3 | +2 | Copper hand, first real |
| 2 | `pig_iron_handbow` | Pig Iron Handbow | +6 | +4 | Iron hand, crude |
| 3 | `bellmetal_handbow` | Bellmetal Handbow | +9 | +6 | Brass hand, warm |
| 4 | `blackbar_handbow` | Blackbar Handbow | +12 | +8 | Black hand, aggressive |
| 5 | `wardensteel_handbow` | Wardensteel Handbow | +15 | +10 | Steel hand, guard |
| 6 | `greenwold_handbow` | Greenwold Handbow | +18 | +12 | Green hand, forest |
| 7 | `graveiron_handbow` | Graveiron Handbow | +21 | +14 | Dark hand, crypt |
| 8 | `blueglass_handbow` | Blueglass Handbow | +24 | +16 | Blue hand, magical |
| 9 | `carmine_steel_handbow` | Carmine Steel Handbow | +27 | +18 | Red hand, war, canonical |
| 10 | `argent_handbow` | Argent Handbow | +30 | +20 | Silver hand, noble |
| 11 | `crownsteel_handbow` | Crownsteel Handbow | +33 | +22 | Gold hand, royal |
| 12 | `starfall_handbow` | Starfall Handbow | +36 | +24 | Meteor hand, mythic |

### Greatbow (Siege Crossbow)

> Siege-grade crossbow. Slowest weapon in the game. Devastating damage.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 9 ticks (slowest ranged)
- **Range:** 9 tiles
- **Hands:** 2H
- **Best for:** Siege, maximum ranged damage, killing heavily armoured NPCs
- **Tradeoff:** Cannot use shield, very slow

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_greatbow` | Cobbled Greatbow | +0 | +0 | Scrap siege, barely works |
| 1 | `pennywrought_greatbow` | Pennywrought Greatbow | +6 | +5 | Copper siege, first real |
| 2 | `pig_iron_greatbow` | Pig Iron Greatbow | +12 | +10 | Iron siege, crude |
| 3 | `bellmetal_greatbow` | Bellmetal Greatbow | +18 | +15 | Brass siege, warm |
| 4 | `blackbar_greatbow` | Blackbar Greatbow | +24 | +20 | Black siege, aggressive |
| 5 | `wardensteel_greatbow` | Wardensteel Greatbow | +30 | +25 | Steel siege, guard |
| 6 | `greenwold_greatbow` | Greenwold Greatbow | +36 | +30 | Green siege, forest |
| 7 | `graveiron_greatbow` | Graveiron Greatbow | +42 | +35 | Dark siege, crypt |
| 8 | `blueglass_greatbow` | Blueglass Greatbow | +48 | +40 | Blue siege, magical |
| 9 | `carmine_steel_greatbow` | Carmine Steel Greatbow | +54 | +45 | Red siege, war |
| 10 | `argent_greatbow` | Argent Greatbow | +60 | +50 | Silver siege, noble |
| 11 | `crownsteel_greatbow` | Crownsteel Greatbow | +66 | +55 | Gold siege, canonical |
| 12 | `starfall_greatbow` | Starfall Greatbow | +72 | +60 | Meteor siege, mythic |

## Ranged Weapon Comparison by Playstyle

| Playstyle | Recommended Weapon | Tier | Why |
|-----------|-------------------|------|-----|
| **Fast training** | Quickbow, Crankbow | Any | Fast attack speed, low delay |
| **High damage** | Warbow, Arbalest, Greatbow | High tier | Slow but devastating |
| **Long range** | Stillbow, Longbow | Any | 8-10 tile range |
| **Armour piercing** | Crossbow, Arbalest | Any | Heavy bolts ignore armour |
| **One-handed** | Handbow | Any | Can use shield or off-hand |
| **Mobile combat** | Recurve, Shortbow | Any | Fast, light, versatile |
| **Siege / PvM** | Greatbow | High tier | Maximum damage, slow |
| **Starter** | Shortbow, Latchbow | Lathwood / Pennywrought | Cheap, easy to train |
| **Endgame** | Starbow, Arbalest | Starfall | Mythic, maximum stats |

## Design Rules

1. **Bows use organic tier names.** Lathwood, Bogwood, Bellhorn, Warden Yew, Greenwold, Gravebent, Carmine Ash, Argentwood, Crownhorn.
2. **Crossbows use metal tier names.** Pennywrought, Pig Iron, Bellmetal, Blackbar, Wardensteel, Graveiron, Blueglass, Carmine Steel, Argent, Crownsteel, Starfall.
3. **Tier 0 is Cobbled for both.** Scrap, improvised, tutorial gear.
4. **Never use "Wooden Bow", "Oak Bow", "Willow Bow".** Use Lathwood, Bogwood, etc.
5. **Never use "Bronze Arrow", "Iron Arrow", "Steel Arrow".** Use tier names.
6. **Families are reusable.** A "Shortbow" is always a short bow. A "Latchbow" is always a light crossbow.
7. **Cobbled is the joke.** It should have humorous descriptions and terrible stats.
8. **Starfall is the mythic.** It should feel like a different material category.
9. **Two-handed ranged weapons cannot use shields.** Handbow is the exception (1H).
10. **Range is measured in tiles.** Bows: 5-10 tiles. Crossbows: 5-9 tiles.

## Related Documents

- [`melee.md`](melee.md) — Melee weapons
- [`magic.md`](magic.md) — Magic weapons (staves)
- [`ranged-tiers.md`](../../ranged-tiers.md) — Ranged tier system philosophy
- [`misc/ammunition.md`](../misc/ammunition.md) — Ammunition
- [`POC_SPEC.md`](../../POC_SPEC.md) §13 (Combat system)

---

*Total ranged weapons defined: 182 (14 families × 13 tiers)*
*Total ranged weapons planned: 182 (complete)*

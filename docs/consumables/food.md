---
doc_type: authority
canonical_path: docs/consumables/food.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/consumables/consumable-system.md`
- `docs/resources/fish-and-cooking.md`
- `docs/resources/herbs-roots-and-fungi.md`
- `docs/skills/production-skills.md`

# Food

> **The canonical food system of Old Town.** Food is not just healing. It is the economy of the town: market stalls, workshop kitchens, trail rations, and ritual feasts. Every food item has a place, a price, and a purpose.
>
> **Rule:** No food may be introduced without a canonical name, a cooking level, and at least one gameplay effect (healing, stamina, or buff).

---

## Food Categories

### Market Food

Cheap, common, and sold in bulk. The backbone of the town economy.

| Item ID | Name | Heals | Cooking Level | Burn Chance | Notes |
|---------|------|-------|--------------|-------------|-------|
| `apple` | Apple | 3 HP | 1 | 0% | Foraged, no cooking needed |
| `bellbread` | Bellbread | 5 HP | 1 | 5% | Starter bread, baked with bell flour |
| `cooked_ditch_shrimp` | Cooked Ditch Shrimp | 3 HP | 1 | 5% | Basic cooked fish |
| `cooked_tinfin` | Cooked Tinfin | 5 HP | 5 | 10% | Small coastal fish |
| `cooked_bell_herring` | Cooked Bell Herring | 7 HP | 10 | 12% | Common market fish |
| `market_stew` | Market Stew | 8 HP | 15 | 15% | Cheap bulk stew, sold in bowls |

### Workshop Food

Eaten at workshops, forges, and kilns. Restores stamina and focus.

| Item ID | Name | Heals | Stamina | Cooking Level | Burn Chance | Notes |
|---------|------|-------|---------|--------------|-------------|-------|
| `eel_broth` | Eel Broth | 12 HP | +10 | 25 | 18% | Hearty broth, keeps workers warm |
| `graveyard_tea` | Graveyard Tea | 4 HP | +5 | 30 | 10% | Strong tea, not for drinking; for dipping bread |
| `crab_cakes` | Crab Cakes | 16 HP | +15 | 40 | 25% | Celebration food from rockclaw |
| `workshop_pie` | Workshop Pie | 10 HP | +8 | 35 | 20% | Portable pie for the forge |

### Trail Food

For explorers, wayfarers, and wardens on the road. Light, preserved, and practical.

| Item ID | Name | Heals | Stamina | Cooking Level | Burn Chance | Notes |
|---------|------|-------|---------|--------------|-------------|-------|
| `warden_ration` | Warden Ration | 12 HP | +10 | 20 | 0% | Dried, preserved. No burn. |
| `dried_meat` | Dried Meat | 8 HP | +5 | 15 | 0% | Smoked and salted, lasts forever |
| `travel_bread` | Travel Bread | 6 HP | +3 | 10 | 0% | Hardtack, dense and dry |
| `ferry_fish` | Ferry Fish | 10 HP | +8 | 25 | 15% | Cooked on the ferry brazier |

### Combat Food

Reliable healing for combat, dungeons, and contracts. Slower to eat, but heals more.

| Item ID | Name | Heals | Cooking Level | Burn Chance | Notes |
|---------|------|-------|--------------|-------------|-------|
| `cooked_brook_trout` | Cooked Brook Trout | 9 HP | 20 | 15% | First river fish |
| `cooked_river_eel` | Cooked River Eel | 11 HP | 30 | 18% | River delicacy |
| `cooked_redback_salmon` | Cooked Redback Salmon | 13 HP | 40 | 20% | Mid-tier river fish |
| `meat_pie` | Meat Pie | 14 HP | 30 | 25% | Two bites, 7 HP each |
| `cooked_rockclaw` | Cooked Rockclaw | 18 HP | 60 | 25% | Large clawed crab |
| `cooked_deepwater_eel` | Cooked Deepwater Eel | 22 HP | 70 | 28% | Mid-tier ocean eel |
| `cooked_glass_eel` | Cooked Glass Eel | 26 HP | 80 | 30% | Translucent eel |
| `cooked_argent_ray` | Cooked Argent Ray | 28 HP | 85 | 32% | Silver flatfish |
| `cooked_crown_turtle` | Cooked Crown Turtle | 30 HP | 90 | 35% | Rare turtle |
| `cooked_starfall_crab` | Cooked Starfall Crab | 32 HP | 95 | 38% | Endgame crab |

### Combo Food

Small heal + instant secondary effect. Used in PvP and high-pressure combat.

| Item ID | Name | Heal | Secondary Effect | Cooking Level | Burn Chance |
|---------|------|------|-----------------|--------------|-------------|
| `tinfin_pie` | Tinfin Pie | 5 HP | +2% attack speed | 15 | 15% |
| `salmon_roll` | Salmon Roll | 8 HP | +5 stamina | 35 | 20% |
| `eel_broth_combo` | Eel Broth (Combo) | 10 HP | +10 stamina | 45 | 25% |
| `crab_cake_combo` | Crab Cake (Combo) | 12 HP | +5% damage | 55 | 28% |
| `argent_cutlet` | Argent Cutlet | 15 HP | +10% precision | 75 | 30% |
| `starfall_crumpet` | Starfall Crumpet | 18 HP | +15% all stats | 95 | 35% |

### Stews

Strong buffs, but require preparation and a safe place to eat.

| Item ID | Name | Heals | Buff | Duration | Cooking Level | Burn Chance |
|---------|------|-------|------|----------|--------------|-------------|
| `market_stew` | Market Stew | 8 HP | None | — | 15 | 15% |
| `warden_stew` | Warden Stew | 14 HP | +5% Guard | 5 minutes | 40 | 25% |
| `graveyard_stew` | Graveyard Stew | 16 HP | +5% vs undead | 5 minutes | 55 | 30% |
| `carmine_stew` | Carmine Stew | 20 HP | +10% damage | 5 minutes | 70 | 35% |
| `starfall_stew` | Starfall Stew | 24 HP | +15% all stats | 5 minutes | 95 | 40% |

### Teas

Utility drinks for Favour, Magic, Hearthcraft, and social occasions.

| Item ID | Name | Heals | Buff | Duration | Cooking Level | Notes |
|---------|------|-------|------|----------|--------------|-------|
| `graveyard_tea` | Graveyard Tea | 4 HP | +2 Favour | 10 minutes | 30 | Crypt resistance |
| `blueglass_tea` | Blueglass Tea | 3 HP | +2 Magic | 10 minutes | 45 | Focus tea |
| `warden_tea` | Warden Tea | 5 HP | +2 Favour | 10 minutes | 50 | Ritual tea |
| `greenwold_tea` | Greenwold Tea | 4 HP | +5% stamina | 10 minutes | 60 | Trail tea |
| `starfall_tea` | Starfall Tea | 6 HP | +5 all stats | 10 minutes | 90 | Master tea |

---

## Food by Game Stage

| Stage | Food | Heals | Source |
|-------|------|-------|--------|
| Tutorial | Apple, Bellbread | 3-5 HP | Foraged, baked |
| Early game | Cooked Ditch Shrimp, Cooked Tinfin | 3-5 HP | Fishing + Cooking |
| Mid game | Cooked Bell Herring, Cooked Brook Trout | 7-9 HP | Fishing + Cooking |
| Mid-late | Cooked Redback Salmon, Meat Pie | 13-14 HP | Fishing + Cooking |
| Late game | Cooked Deepwater Eel | 22 HP | Deep fishing |
| Endgame | Cooked Argent Ray, Cooked Crown Turtle, Cooked Starfall Crab | 28-32 HP | Elite fishing |

---

## Food Tiers and Cultural Identity

### Market Food Identity

- **Bellbread** — the staple bread of Old Town, baked with bell flour. Every household has a bellbread recipe.
- **Hand pies** — portable, two-bite food for travellers. Sold at market stalls.
- **Market stew** — sold in bowls at the town market. Made with whatever is fresh.

### Workshop Food Identity

- **Eel broth** — hearty broth made from river eels, served at workshops. Keeps workers warm.
- **Crab cakes** — made from rockclaw, served at the coastal workshops. A celebration food.
- **Graveyard tea** — strong tea brewed with graveyard moss, served at the forge. Not for drinking; for dipping bread.

### Trail Food Identity

- **Warden ration** — dried, preserved food for wardens on contract. Hardtack, dried meat, and nuts.
- **Travel bread** — dense, dry hardtack. It lasts forever and tastes like nothing.
- **Ferry fish** — cooked on the ferry brazier while crossing the Wardenbrook.

### Ritual Food Identity

- **Crown turtle soup** — served at royal and master ceremonies. A symbol of status.
- **Starfall crab cakes** — served at the endgame feast. Made only when a starfall crab is caught.
- **Salmon pie** — traditional festival food, made with redback salmon. Served at the midsummer feast.

---

## Cooking Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Bake** | Cook in an oven | "Bake the bellbread in the workshop oven" |
| **Stew** | Simmer in a pot | "Stew the rockclaw with warden herbs" |
| **Broil** | Cook over open flame | "Broil the glass eel on the hearth" |
| **Fry** | Cook in oil | "Fry the ditch shrimp in warden oil" |
| **Preserve** | Salt, smoke, or pickle | "Preserve the salmon for the winter" |
| **Ferment** | Age with bacteria/yeast | "Ferment the warden tea for a week" |
| **Distill** | Extract pure essence | "Distill the graveyard tea for potency" |

---

## Design Rules

1. **No generic fantasy food.** `bread`, `fish`, `stew` are too generic. Use `bellbread`, `deepwater eel broth`, `warden stew`.
2. **Every food has a place.** Market food is sold in town. Trail food is eaten on the road. Workshop food is eaten at the forge.
3. **Every food has a tier.** Higher-tier food heals more and has higher burn chance.
4. **Combo food exists.** Combo food heals in stages and grants secondary effects.
5. **Stews grant buffs.** Stews are slower to eat but grant longer buffs.
6. **Teas grant utility.** Teas are for Favour, Magic, and stamina, not healing.
7. **Cultural framing.** Every food has a story: `Crown turtle soup` is royal. `Starfall crab cakes` are celebratory.
8. **Economy integration.** Every food requires resources from Fishing, Gardening, or Trapping.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`consumable-system.md`](consumable-system.md) — Core consumable authority
- [`potions.md`](potions.md) — Potion system
- [`brews.md`](brews.md) — Brew system
- [`poisons.md`](poisons.md) — Poison system
- [`salves-and-oils.md`](salves-and-oils.md) — Salves and oils
- [`status-effects.md`](status-effects.md) — Status effects
- [`../resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) — Fish taxonomy
- [`../resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) — Herb taxonomy

---

*Total food items defined: 30+*
*Last updated: 2026-05-30*

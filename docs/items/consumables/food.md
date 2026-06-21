# Food

> All food items in Old Town. Food is the primary healing method. See `docs/resources/fish-and-cooking.md` for the canonical resource taxonomy.
>
> **Rule:** All food names must use canonical fish names and Old Town food identity.

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
| `bellbread` | Bellbread | 5 HP | 1 | 5% | Starter food, baked with bell flour |
| `cooked_ditch_shrimp` | Cooked Ditch Shrimp | 3 HP | 1 | 5% | Basic shrimp |
| `cooked_tinfin` | Cooked Tinfin | 5 HP | 5 | 10% | Small coastal fish |
| `cooked_bell_herring` | Cooked Bell Herring | 7 HP | 10 | 12% | Common market fish |
| `cooked_brook_trout` | Cooked Brook Trout | 9 HP | 20 | 15% | First river fish |
| `cooked_river_eel` | Cooked River Eel | 11 HP | 30 | 18% | River delicacy |
| `cooked_redback_salmon` | Cooked Redback Salmon | 13 HP | 40 | 20% | Mid-tier river fish |
| `meat_pie` | Meat Pie | 14 HP | 30 | 25% | Hand pie, two bites |
| `cooked_rockclaw` | Cooked Rockclaw | 18 HP | 60 | 25% | Large clawed crab |
| `cooked_deepwater_eel` | Cooked Deepwater Eel | 22 HP | 70 | 28% | Mid-tier ocean eel |
| `cooked_glass_eel` | Cooked Glass Eel | 26 HP | 80 | 30% | Translucent eel |
| `cooked_argent_ray` | Cooked Argent Ray | 28 HP | 85 | 32% | Silver flatfish |
| `cooked_crown_turtle` | Cooked Crown Turtle | 30 HP | 90 | 35% | Rare turtle |
| `cooked_starfall_crab` | Cooked Starfall Crab | 32 HP | 95 | 38% | Endgame crab |

## Food Tiers by Game Stage

| Stage | Food | Heals | Source |
|-------|------|-------|--------|
| Tutorial | Apple, Bellbread | 3-5 HP | Foraged, baked |
| Early game | Cooked Ditch Shrimp, Cooked Tinfin | 3-5 HP | Fishing + Cooking |
| Mid game | Cooked Bell Herring, Cooked Brook Trout | 7-9 HP | Fishing + Cooking |
| Mid-late | Cooked Redback Salmon, Meat Pie | 13-14 HP | Fishing + Cooking |
| Late game | Cooked Deepwater Eel | 22 HP | Deep fishing |
| Endgame | Cooked Argent Ray, Cooked Crown Turtle, Cooked Starfall Crab | 28-32 HP | Elite fishing |

## Old Town Food Identity

Old Town food is not generic fantasy fare. It is rooted in the world: market food, road food, workshop food, and ritual food.

### Market Food

- **Hand pies** — portable, two-bite food for travellers. Sold at the market stalls.
- **Market stew** — sold in bowls at the town market. Made with whatever is fresh.
- **Bellbread** — the staple bread of Old Town, baked with bell flour. Every household has a bellbread recipe.
- **Warden ration** — dried, preserved food for wardens on contract. Hardtack, dried meat, and nuts.

### Workshop Food

- **Eel broth** — hearty broth made from river eels, served at workshops. Keeps workers warm.
- **Crab cakes** — made from rockclaw, served at the coastal workshops. A celebration food.
- **Graveyard tea** — strong tea brewed with graveyard moss, served at the forge. Not for drinking; for dipping bread.

### Ritual Food

- **Crown turtle soup** — served at royal and master ceremonies. A symbol of status.
- **Starfall crab cakes** — served at the endgame feast. Made only when a starfall crab is caught.
- **Salmon pie** — traditional festival food, made with redback salmon. Served at the midsummer feast.

### Special Food

| Item ID | Name | Heals | Effect | Notes |
|---------|------|-------|--------|-------|
| `meat_pie` | Meat Pie | 14 HP | Two bites | Each bite heals 7 HP. Total 14 HP. |
| `bellbread` | Bellbread | 5 HP | Baked | Made from bell flour + water + fire. |
| `warden_ration` | Warden Ration | 12 HP | No burn | Dried, preserved. For wardens on contract. |
| `eel_broth` | Eel Broth | 16 HP | Warmth | Heals and restores 5% stamina. |
| `crab_cakes` | Crab Cakes | 20 HP | Celebration | Made from rockclaw. +5% happiness. |
| `graveyard_tea` | Graveyard Tea | 4 HP | Focus | Not for drinking; for dipping bread. +5% crafting speed. |

## Cooking Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Bake** | Cook in an oven | "Bake the bellbread in the workshop oven" |
| **Stew** | Simmer in a pot | "Stew the rockclaw with warden herbs" |
| **Broil** | Cook over open flame | "Broil the glass eel on the hearth" |
| **Fry** | Cook in oil | "Fry the ditch shrimp in warden oil" |
| **Preserve** | Salt, smoke, or pickle | "Preserve the salmon for the winter" |

## Related Documents

- [`potions.md`](potions.md) — Potion items
- [`00-index.md`](00-index.md) — Consumables overview
- [`../../resources/fish-and-cooking.md`](../../resources/fish-and-cooking.md) — Canonical fish and food taxonomy

---

*Total food items defined: 16*
*All fish names match canonical taxonomy: Yes*
*Last updated: 2026-05-30*

---
doc_type: authority
canonical_path: docs/recipes/smithing-recipes.md
parent_index: docs/recipes/00-index.md
root_index: docs/00-index.md
---

Parent: [`Recipes Index`](00-index.md)

Authority references:
- `docs/skills/production-skills.md`
- `docs/tools-and-intermediates/intermediate-items.md`
- `docs/resources/ores-and-stone.md`
- `docs/recipes/recipe-system.md`

# Smithing Recipes

Smithing has three recipe types: smelt, forge, and fit. It turns mining output into weapons, armour, tools, ammunition parts, fittings, and cross-skill components.

## Recipe Types

| Type | Example | Purpose |
|------|---------|---------|
| Smelt | Ore plus fuel to bar or ingot | Raw to usable |
| Forge | Bar plus hammer to weapon, armour, or tool | Gear creation |
| Fit | Rivets, wire, or fittings to upgrades and components | Cross-skill support |

## Canonical Intermediates

| Intermediate | Recipe Role |
|--------------|-------------|
| Pennywrought Ingot | Starter metal base |
| Pig Iron Bar | Early weapons and nails |
| Bellmetal Bar | Town gear and buckles |
| Blackbar Rod | Hinges and aggressive gear |
| Wardensteel Plate | Armour, tools, and contracts |
| Graveiron Rivets | Crypt gear and reinforced pouches |
| Blueglass Inlay | Magic gear, lenses, and foci |
| Carmine Wire | Traps and duelist gear |
| Argent Filigree | Jewellery and reliquaries |
| Crownsteel Fittings | Prestige gear and furniture |
| Starfall Core | Mythic tools, weapons, and trophies |

## Starter Recipes

| Recipe ID | Skill | Level | Tool | Station | Inputs | Outputs | Byproduct | Role |
|-----------|-------|-------|------|---------|--------|---------|-----------|------|
| smelt-pennywrought-ingot | Smithing | 1 | Tongs | Bellows Furnace | Penny Copper, Tinstone | Pennywrought Ingot | Slag | Training |
| forge-pennywrought-shortblade | Smithing | 1 | Pig Iron Hammer | Anvil | Pennywrought Ingot | Pennywrought Shortblade | Metal Scraps | Arms gear |
| forge-pennywrought-ward | Smithing | 5 | Pig Iron Hammer | Anvil | Pennywrought Ingot, Rivets | Pennywrought Ward | Metal Scraps | Guard gear |
| forge-penny-arrowheads | Smithing | 5 | Pig Iron Hammer | Anvil | Pennywrought Ingot | Penny Arrowheads | Metal Scraps | Bowcraft input |
| fit-graveiron-rivets | Smithing | 50 | Warden Tongs | Anvil | Graveiron Bar | Graveiron Rivets | Metal Scraps | Container and armour support |

## Design Rules

1. Smelting requires a furnace or equivalent heat station.
2. Forging requires an anvil and hammer.
3. Fitting recipes should feed other skills, especially Bowcraft, Tailoring, Handicraft, Carpentry, and Beadwork.
4. Slag and scraps are valid byproducts when they have later use.


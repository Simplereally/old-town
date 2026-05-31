---
doc_type: authority
canonical_path: docs/recipes/cooking-recipes.md
parent_index: docs/recipes/00-index.md
root_index: docs/00-index.md
---

Parent: [`Recipes Index`](00-index.md)

Authority references:
- `docs/consumables/food.md`
- `docs/items/consumables/food.md`
- `docs/resources/fish-and-cooking.md`
- `docs/recipes/recipe-system.md`

# Cooking Recipes

Cooking should be more than fish on fire. It is the main healing pipeline and an early lesson in tools, stations, failures, and byproducts.

## Recipe Families

| Family | Example | Role |
|--------|---------|------|
| Simple cook | Raw fish to cooked fish | Baseline healing |
| Skewer | Fish or meat plus stick | Cheap early food |
| Pie | Tinfin plus dough | Combo food |
| Broth | Eel plus pot plus herbs | Sustain |
| Stew | Meat or fish plus vegetables | Slow strong food |
| Tea | Herb plus water plus hearth | Utility and Favour |
| Preserve | Fish or meat plus salt | Trail food |
| Feast | Rare fish plus station | Group or prestige food |

## Starter Recipes

| Recipe ID | Skill | Level | Tool | Station | Inputs | Outputs | Failure | Role |
|-----------|-------|-------|------|---------|--------|---------|---------|------|
| cook-ditch-shrimp | Cooking | 1 | Market Pot | Fire or range | Raw Ditch Shrimp | Cooked Ditch Shrimp | Burned Shrimp | Training |
| skewer-tinfin | Cooking | 5 | Knife | Fire | Raw Tinfin, Stick | Tinfin Skewer | Burned Skewer | Training |
| bake-market-pie | Cooking | 15 | Pie Dish | Kitchen Range | Dough, Bell Herring | Market Fish Pie | Burned Pie | Combo food |
| steep-graveyard-tea | Cooking | 25 | Market Pot | Hearth | Graveyard Moss, Phial of Wellwater | Graveyard Tea | Spent Leaves | Utility |
| preserve-brook-trout | Cooking | 35 | Knife | Curing Rack | Raw Brook Trout, Salt | Trail Trout | Fish Offcuts | Trail food |

## Design Rules

1. Raw and cooked versions should be explicit item IDs.
2. Simple cooking can use fire. Pies, broths, stews, teas, preserves, and feasts should prefer stations.
3. Burn failure belongs mostly to heat recipes.
4. Prep recipes should make offcuts, scraps, or empty containers when useful.
5. Combo food and trail food are first-class recipe families.


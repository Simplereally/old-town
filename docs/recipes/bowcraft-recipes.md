---
doc_type: authority
canonical_path: docs/recipes/bowcraft-recipes.md
parent_index: docs/recipes/00-index.md
root_index: docs/00-index.md
---

Parent: [`Recipes Index`](00-index.md)

Authority references:
- `docs/skills/production-skills.md`
- `docs/items/misc/ammunition.md`
- `docs/items/weapons/ranged.md`
- `docs/recipes/recipe-system.md`

# Bowcraft Recipes

Bowcraft is the component-heavy starter skill for Ranged. It should make ranged weapons and ammunition feel manufactured, not dropped fully formed.

## Recipe Types

| Recipe | Inputs | Output |
|--------|--------|--------|
| Cut shafts | Log plus knife | Arrow shafts |
| Make stave | Log plus knife | Bow stave |
| String bow | Bow stave plus sinew cord | Bow |
| Make arrows | Shafts plus feathers plus heads | Arrows |
| Make bolts | Bolt shafts plus bolt heads | Bolts |
| Make darts | Dart tips plus feathers | Darts |
| Make javelins | Javelin shaft plus javelin head | Javelins |

## Starter Recipes

| Recipe ID | Skill | Level | Tool | Station | Inputs | Outputs | Byproduct | Role |
|-----------|-------|-------|------|---------|--------|---------|-----------|------|
| cut-lathwood-arrow-shafts | Bowcraft | 1 | Whittling Knife | None | Lathwood Log | Arrow Shafts | Wood Offcuts | Training |
| carve-lathwood-bow-stave | Bowcraft | 5 | Whittling Knife | None | Lathwood Log | Lathwood Bow Stave | Wood Offcuts | Ranged weapon input |
| string-lathwood-shortbow | Bowcraft | 5 | Whittling Knife | Bow Bench | Lathwood Bow Stave, Sinew Cord | Lathwood Shortbow | None | Ranged weapon |
| fletch-lathwood-arrows | Bowcraft | 1 | Whittling Knife | None | Arrow Shafts, Bellfeathers, Penny Arrowheads | Lathwood Arrows | Broken Shafts | Ammunition |
| assemble-penny-bolts | Bowcraft | 15 | Bellwood Jig | Bow Bench | Bolt Shafts, Penny Bolt Heads | Penny Bolts | Bent Shafts | Ammunition |

## Design Rules

1. Shafts, staves, stocks, heads, tips, feathers, and cords should be tradeable intermediates.
2. Batching is required for ammunition.
3. Bows should usually have an unstrung stage and a stringing stage.
4. Crossbows and bolts should lean on stations earlier than simple bows and arrows.


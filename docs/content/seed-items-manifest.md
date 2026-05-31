---
doc_type: manifest
canonical_path: docs/content/seed-items-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/items/00-index.md`
- `docs/resources/00-index.md`
- `docs/consumables/00-index.md`
- `docs/tools-and-intermediates/tool-system.md`

# Seed Items Manifest

> **Minimum item seed set for the starter vertical slice.** These items are the smallest set needed to make the 6 starter loops and 7 starter quests playable.

## Currency and Civic

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `coins` | Coins | currency | yes | yes | 1 | 0 | — | — | — | [`docs/items/misc/currency.md`](../items/misc/currency.md) |
| `bell-token` | Bell Token | currency | yes | yes | 10 | 0 | — | — | — | [`docs/items/misc/currency.md`](../items/misc/currency.md) |
| `warden-mark` | Warden Mark | currency | yes | no | 100 | 0 | — | — | — | [`docs/items/misc/currency.md`](../items/misc/currency.md) |

## Starter Combat

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `cobbled-sticker` | Cobbled Sticker | weapon | no | yes | 5 | 1.5 | Wield, Drop | main-hand | +1 stab | [`docs/items/weapons/melee.md`](../items/weapons/melee.md) |
| `pennywrought-shortblade` | Pennywrought Shortblade | weapon | no | yes | 50 | 1.5 | Wield, Drop | main-hand | +4 slash | [`docs/items/weapons/melee.md`](../items/weapons/melee.md) |
| `lathwood-shortbow` | Lathwood Shortbow | weapon | no | yes | 60 | 2.0 | Wield, Drop | two-hand | +3 ranged | [`docs/items/weapons/ranged.md`](../items/weapons/ranged.md) |
| `chalkmarked-wand` | Chalkmarked Wand | weapon | no | yes | 55 | 1.0 | Wield, Drop | main-hand | +2 magic | [`docs/items/weapons/magic.md`](../items/weapons/magic.md) |
| `chalkmarked-primer` | Chalkmarked Primer | weapon | no | yes | 40 | 0.5 | Wield, Drop | off-hand | +1 magic | [`docs/items/weapons/magic.md`](../items/weapons/magic.md) |
| `patchhide-coif` | Patchhide Coif | armour | no | yes | 35 | 0.8 | Wear, Drop | head | +2 ranged def | [`docs/items/armour/00-index.md`](../items/armour/00-index.md) |
| `patchhide-jerkin` | Patchhide Jerkin | armour | no | yes | 50 | 2.5 | Wear, Drop | chest | +4 ranged def | [`docs/items/armour/00-index.md`](../items/armour/00-index.md) |
| `patchhide-chaps` | Patchhide Chaps | armour | no | yes | 40 | 1.5 | Wear, Drop | legs | +3 ranged def | [`docs/items/armour/00-index.md`](../items/armour/00-index.md) |

## Starter Tools

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `pennywrought-pickaxe` | Pennywrought Pickaxe | tool | no | yes | 30 | 2.0 | Use, Drop | — | — | [`docs/items/tools/gathering.md`](../items/tools/gathering.md) |
| `pig-iron-hammer` | Pig Iron Hammer | tool | no | yes | 25 | 2.5 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `whittling-knife` | Whittling Knife | tool | no | yes | 15 | 0.5 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `bone-needle` | Bone Needle | tool | no | yes | 10 | 0.1 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `reed-rod` | Reed Rod | tool | no | yes | 12 | 0.8 | Use, Drop | — | — | [`docs/items/tools/gathering.md`](../items/tools/gathering.md) |
| `small-net` | Small Net | tool | no | yes | 8 | 0.5 | Use, Drop | — | — | [`docs/items/tools/gathering.md`](../items/tools/gathering.md) |
| `bead-drill` | Bead Drill | tool | no | yes | 20 | 0.3 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `glaze-bowl` | Glaze Bowl | tool | no | yes | 15 | 0.5 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `market-pot` | Market Pot | tool | no | yes | 10 | 1.0 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `flintbox` | Flintbox | tool | no | yes | 5 | 0.2 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |
| `bent-pick` | Bent Pick | tool | no | yes | 3 | 2.0 | Use, Drop | — | — | [`docs/items/tools/gathering.md`](../items/tools/gathering.md) |
| `chalk-compass` | Chalk Compass | tool | no | yes | 18 | 0.3 | Use, Drop | — | — | [`docs/items/tools/crafting.md`](../items/tools/crafting.md) |

## Resources

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `penny-copper-ore` | Penny Copper Ore | resource | yes | yes | 5 | 1.0 | — | — | — | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `tinstone` | Tinstone | resource | yes | yes | 5 | 1.0 | — | — | — | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `pig-iron-ore` | Pig Iron Ore | resource | yes | yes | 8 | 1.2 | — | — | — | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `blackcoal` | Blackcoal | resource | yes | yes | 6 | 0.8 | — | — | — | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `oldroad-oak-log` | Oldroad Oak Log | resource | yes | yes | 8 | 1.5 | — | — | — | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |
| `riverwillow-log` | Riverwillow Log | resource | yes | yes | 10 | 1.5 | — | — | — | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |
| `bellfeathers` | Bellfeathers | resource | yes | yes | 3 | 0.1 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `sinew-cord` | Sinew Cord | resource | yes | yes | 4 | 0.2 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `rabbit-hide` | Rabbit Hide | resource | yes | yes | 6 | 0.5 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `fox-hide` | Fox Hide | resource | yes | yes | 12 | 0.8 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `bead-clay` | Bead Clay | resource | yes | yes | 4 | 0.5 | — | — | — | [`docs/resources/bead-materials.md`](../resources/bead-materials.md) |
| `glass-sand` | Glass Sand | resource | yes | yes | 5 | 0.5 | — | — | — | [`docs/resources/bead-materials.md`](../resources/bead-materials.md) |
| `ditch-shrimp` | Ditch Shrimp | resource | yes | yes | 3 | 0.3 | — | — | — | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |
| `tinfin` | Tinfin | resource | yes | yes | 5 | 0.5 | — | — | — | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |
| `graveyard-moss` | Graveyard Moss | resource | yes | yes | 4 | 0.2 | — | — | — | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |
| `grave-flower` | Grave Flower | resource | yes | yes | 6 | 0.2 | — | — | — | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |
| `small-bones` | Small Bones | resource | yes | yes | 2 | 0.3 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `bone-chips` | Bone Chips | resource | yes | yes | 3 | 0.1 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `grave-dust` | Grave Dust | resource | yes | yes | 5 | 0.2 | — | — | — | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |

## Consumables

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `bellbread` | Bellbread | food | yes | yes | 4 | 0.3 | Eat | — | +5 HP | [`docs/consumables/food.md`](../consumables/food.md) |
| `ditch-shrimp-skewer` | Ditch Shrimp Skewer | food | yes | yes | 6 | 0.3 | Eat | — | +7 HP | [`docs/consumables/food.md`](../consumables/food.md) |
| `tinfin-pie` | Tinfin Pie | food | yes | yes | 10 | 0.5 | Eat | — | +9 HP | [`docs/consumables/food.md`](../consumables/food.md) |
| `warden-ration` | Warden Ration | food | yes | yes | 12 | 0.4 | Eat | — | +12 HP | [`docs/consumables/food.md`](../consumables/food.md) |
| `arms-tincture` | Arms Tincture | potion | yes | yes | 25 | 0.3 | Drink | — | +3 Arms | [`docs/consumables/potions.md`](../consumables/potions.md) |
| `cleanblood-salve` | Cleanblood Salve | salve | yes | yes | 15 | 0.2 | Use | — | Cure poison | [`docs/consumables/salves-and-oils.md`](../consumables/salves-and-oils.md) |
| `favour-cordial` | Favour Cordial | potion | yes | yes | 30 | 0.3 | Drink | — | +3 Favour | [`docs/consumables/potions.md`](../consumables/potions.md) |
| `shrine-candle` | Shrine Candle | favour | yes | yes | 8 | 0.2 | Light | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `prayer-knot` | Prayer Knot | favour | yes | yes | 5 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |

## Beads

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `gust-bead` | Gust Bead | bead | yes | yes | 20 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `tide-bead` | Tide Bead | bead | yes | yes | 20 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `loam-bead` | Loam Bead | bead | yes | yes | 20 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `ember-bead` | Ember Bead | bead | yes | yes | 20 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `wit-bead` | Wit Bead | bead | yes | yes | 20 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `bone-bead` | Bone Bead | bead | yes | yes | 25 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `grave-bead` | Grave Bead | bead | yes | yes | 30 | 0.1 | Use | — | — | [`docs/favour/favour-items.md`](../favour/favour-items.md) |
| `threadbare-bead-pouch` | Threadbare Bead Pouch | container | no | yes | 50 | 0.5 | Open | — | Holds 5 beads | [`docs/tools-and-intermediates/containers-and-pouches.md`](../tools-and-intermediates/containers-and-pouches.md) |

## Quest and Proof

| id | name | category | stackable | tradeable | value | weight | options | equipment_slot_if_any | stats_if_any | docs_source |
|----|------|----------|-----------|-----------|-------|--------|---------|----------------------|--------------|-------------|
| `rat-tail` | Rat Tail | quest | yes | no | 1 | 0.1 | — | — | — | [`docs/quests/rats-under-tallys.md`](../quests/rats-under-tallys.md) |
| `ratcatcher-tail` | Ratcatcher Tail | quest | yes | no | 5 | 0.1 | — | — | — | [`docs/quests/rats-under-tallys.md`](../quests/rats-under-tallys.md) |
| `ledger-seven` | Ledger Seven | quest | no | no | 0 | 0.1 | Read | — | — | [`docs/quests/the-missing-bell-clapper.md`](../quests/the-missing-bell-clapper.md) |
| `listening-clay` | Listening Clay | quest | yes | no | 2 | 0.5 | — | — | — | [`docs/quests/the-beadwifes-errand.md`](../quests/the-beadwifes-errand.md) |
| `warm-scale` | Warm Scale | quest | yes | no | 10 | 0.2 | — | — | — | [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md) |
| `sooted-receipt` | Sooted Receipt | quest | no | no | 0 | 0.1 | Read | — | — | [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md) |
| `grave-flower-bundle` | Grave Flower Bundle | quest | no | no | 0 | 0.5 | — | — | — | [`docs/quests/gravegate-flowers.md`](../quests/gravegate-flowers.md) |
| `bell-token-proof` | Bell Token Proof | quest | no | no | 0 | 0.1 | — | — | — | [`docs/quests/starter-quest-arc.md`](../quests/starter-quest-arc.md) |

## See also

- [`docs/items/00-index.md`](../items/00-index.md) — Item system details
- [`docs/resources/00-index.md`](../resources/00-index.md) — Resource taxonomy
- [`docs/consumables/00-index.md`](../consumables/00-index.md) — Consumable system
- [`docs/content/seed-materials-manifest.md`](seed-materials-manifest.md) — Material bridge
- [`docs/content/seed-recipes-manifest.md`](seed-recipes-manifest.md) — Recipe consumers

---

*Last updated: 2026-05-31*

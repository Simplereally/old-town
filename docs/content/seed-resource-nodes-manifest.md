---
doc_type: manifest
canonical_path: docs/content/seed-resource-nodes-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/map/resource-node-placement.md`
- `docs/resources/00-index.md`
- `docs/spatial/safe-danger-gradient.md`

# Seed Resource Nodes Manifest

> **E09-critical resource nodes.** These nodes are the gathering anchors for the 6 starter loops. Every node listed here must have a `content/resource-nodes/{resource_node_id}.json` entry.

## Mining

| resource_node_id | display_name | skill_id | required_level | base_xp | action_ticks | depletion_chance | respawn_ticks | tool_tags | output_item_id | output_quantity | map_area | safe_or_pressured | docs_source |
|------------------|--------------|----------|----------------|---------|--------------|------------------|---------------|-----------|----------------|-----------------|----------|-------------------|-------------|
| `penny-copper-deposit` | Penny Copper Deposit | mining | 1 | 15 | 4 | 0.10 | 20 | pickaxe | `penny-copper-ore` | 1 | North Quarry Road | safe | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `tinstone-deposit` | Tinstone Deposit | mining | 1 | 15 | 4 | 0.10 | 20 | pickaxe | `tinstone` | 1 | North Quarry Road | safe | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `pig-iron-outcrop` | Pig Iron Outcrop | mining | 5 | 25 | 5 | 0.15 | 30 | pickaxe | `pig-iron-ore` | 1 | North Quarry Road | pressured | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `blackcoal-pocket` | Blackcoal Pocket | mining | 4 | 20 | 4 | 0.12 | 25 | pickaxe | `blackcoal` | 1 | Sootcellar / North Quarry Road | pressured | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |

## Woodcutting

| resource_node_id | display_name | skill_id | required_level | base_xp | action_ticks | depletion_chance | respawn_ticks | tool_tags | output_item_id | output_quantity | map_area | safe_or_pressured | docs_source |
|------------------|--------------|----------|----------------|---------|--------------|------------------|---------------|-----------|----------------|-----------------|----------|-------------------|-------------|
| `scrub-tree` | Scrub Tree | woodcutting | 1 | 10 | 4 | 0.08 | 15 | hatchet | `oldroad-oak-log` | 1 | Oldroad Gate | safe | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |
| `oldroad-oak-tree` | Oldroad Oak Tree | woodcutting | 2 | 18 | 5 | 0.12 | 25 | hatchet | `oldroad-oak-log` | 1 | Oldroad Gate | safe | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |
| `riverwillow-tree` | Riverwillow Tree | woodcutting | 3 | 22 | 5 | 0.14 | 30 | hatchet | `riverwillow-log` | 1 | River Stoop | safe | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |

## Fishing

| resource_node_id | display_name | skill_id | required_level | base_xp | action_ticks | depletion_chance | respawn_ticks | tool_tags | output_item_id | output_quantity | map_area | safe_or_pressured | docs_source |
|------------------|--------------|----------|----------------|---------|--------------|------------------|---------------|-----------|----------------|-----------------|----------|-------------------|-------------|
| `ditch-shrimp-spot` | Ditch Shrimp Spot | fishing | 1 | 12 | 5 | 0.10 | 20 | net, rod | `ditch-shrimp` | 1 | River Stoop | safe | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |
| `tinfin-ripple` | Tinfin Ripple | fishing | 2 | 18 | 5 | 0.12 | 25 | rod | `tinfin` | 1 | River Stoop | safe | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |
| `river-curio-spot` | River Curio Spot | fishing | 5 | 15 | 6 | 0.08 | 30 | rod | `listening-clay` | 1 | River Stoop | safe | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |

## Trapping

| resource_node_id | display_name | skill_id | required_level | base_xp | action_ticks | depletion_chance | respawn_ticks | tool_tags | output_item_id | output_quantity | map_area | safe_or_pressured | docs_source |
|------------------|--------------|----------|----------------|---------|--------------|------------------|---------------|-----------|----------------|-----------------|----------|-------------------|-------------|
| `rabbit-snare-point` | Rabbit Snare Point | trapping | 1 | 10 | 6 | 0.10 | 20 | snare | `rabbit-hide` | 1 | Patch Lane | safe | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `bog-fox-track` | Bog Fox Track | trapping | 5 | 20 | 8 | 0.15 | 40 | snare | `fox-hide` | 1 | Patch Lane / Gravegate | pressured | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `bird-lure-spot` | Bird Lure Spot | trapping | 3 | 15 | 6 | 0.12 | 25 | snare | `bellfeathers` | 1-3 | Lath Yard | safe | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |

## Gardening

| resource_node_id | display_name | skill_id | required_level | base_xp | action_ticks | depletion_chance | respawn_ticks | tool_tags | output_item_id | output_quantity | map_area | safe_or_pressured | docs_source |
|------------------|--------------|----------|----------------|---------|--------------|------------------|---------------|-----------|----------------|-----------------|----------|-------------------|-------------|
| `grave-flower-patch` | Grave Flower Patch | gardening | 1 | 8 | 5 | 0.10 | 25 | trowel | `grave-flower` | 1 | Gravegate | safe | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |
| `allotment-patch` | Allotment Patch | gardening | 3 | 12 | 6 | 0.08 | 30 | trowel | `graveyard-moss` | 1 | Shrine Hearth | safe | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |
| `herb-pot-table` | Herb Pot Table | gardening | 1 | 6 | 4 | 0.05 | 20 | trowel | `graveyard-moss` | 1 | Chalkhouse Court | safe | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |

## Tuning Note

> **Exact numbers are provisional tuning.** XP values, depletion chances, and respawn ticks require playtesting. Do not treat these as final design gospel. Adjust during E09 implementation based on loop timing and competition tests.

## See also

- [`docs/map/resource-node-placement.md`](../map/resource-node-placement.md) — Node coordinates
- [`docs/resources/00-index.md`](../resources/00-index.md) — Resource taxonomy
- [`docs/spatial/safe-danger-gradient.md`](../spatial/safe-danger-gradient.md) — Safe and pressured classification
- [`docs/content/seed-items-manifest.md`](seed-items-manifest.md) — Output item definitions
- [`docs/content/seed-recipes-manifest.md`](seed-recipes-manifest.md) — Recipe consumers

---

*Last updated: 2026-05-31*

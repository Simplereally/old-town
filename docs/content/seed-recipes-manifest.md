---
doc_type: manifest
canonical_path: docs/content/seed-recipes-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/recipes/recipe-system.md`
- `docs/recipes/recipe-chains.md`
- `docs/content/seed-items-manifest.md`
- `docs/content/seed-objects-and-stations-manifest.md`

# Seed Recipes Manifest

> **E09/E08 starter recipes.** These recipes are the production anchors for the 6 starter loops. Every recipe listed here must have a `content/processing-recipes/{recipe_id}.json` entry.

## Cooking

| recipe_id | skill_id | required_level | xp | action_ticks | required_tool_tags | required_station_object_id | input_items | output_items | failure_mode | byproducts | unlock_condition | docs_source |
|-----------|----------|----------------|----|--------------|--------------------|---------------------------|-------------|--------------|--------------|------------|------------------|-------------|
| `cook-ditch-shrimp-skewer` | cooking | 1 | 15 | 4 | — | `market-kitchen-hearth` | `ditch-shrimp` x1 | `ditch-shrimp-skewer` x1 | Burned shrimp (waste) | — | Default | [`docs/recipes/cooking-recipes.md`](../recipes/cooking-recipes.md) |
| `bake-bellbread` | cooking | 1 | 12 | 5 | — | `market-kitchen-hearth` | Flour x1, Water x1 | `bellbread` x1 | Burned bread (waste) | — | Default | [`docs/recipes/cooking-recipes.md`](../recipes/cooking-recipes.md) |
| `make-tinfin-pie` | cooking | 5 | 25 | 6 | — | `market-kitchen-hearth` | `tinfin` x1, Flour x1, Water x1 | `tinfin-pie` x1 | Burnt pie (waste) | — | Default | [`docs/recipes/cooking-recipes.md`](../recipes/cooking-recipes.md) |
| `make-warden-ration` | cooking | 3 | 20 | 5 | — | `market-kitchen-hearth` | `ditch-shrimp` x2, `oldroad-oak-log` x1 | `warden-ration` x1 | Spoiled ration (waste) | — | Default | [`docs/recipes/cooking-recipes.md`](../recipes/cooking-recipes.md) |

## Smithing

| recipe_id | skill_id | required_level | xp | action_ticks | required_tool_tags | required_station_object_id | input_items | output_items | failure_mode | byproducts | unlock_condition | docs_source |
|-----------|----------|----------------|----|--------------|--------------------|---------------------------|-------------|--------------|--------------|------------|------------------|-------------|
| `smelt-pennywrought-ingot` | smithing | 1 | 18 | 5 | hammer | `foundry-furnace` | `penny-copper-ore` x2, `tinstone` x2, `blackcoal` x1 | `pennywrought-ingot` x1 | Slag (waste) | — | Default | [`docs/recipes/smithing-recipes.md`](../recipes/smithing-recipes.md) |
| `forge-pennywrought-shortblade` | smithing | 1 | 25 | 6 | hammer | `foundry-anvil` | `pennywrought-ingot` x2 | `pennywrought-shortblade` x1 | Bent blade (waste) | — | Default | [`docs/recipes/smithing-recipes.md`](../recipes/smithing-recipes.md) |
| `forge-pennywrought-helm` | smithing | 3 | 30 | 6 | hammer | `foundry-anvil` | `pennywrought-ingot` x3 | `pennywrought-helm` x1 | Cracked helm (waste) | — | Default | [`docs/recipes/smithing-recipes.md`](../recipes/smithing-recipes.md) |
| `forge-pennywrought-ward` | smithing | 5 | 35 | 6 | hammer | `foundry-anvil` | `pennywrought-ingot` x3 | `pennywrought-ward` x1 | Warped ward (waste) | — | Default | [`docs/recipes/smithing-recipes.md`](../recipes/smithing-recipes.md) |
| `repair-starter-tool` | smithing | 1 | 10 | 4 | hammer | `foundry-anvil` | `bent-pick` x1, `penny-copper-ore` x1 | `pennywrought-pickaxe` x1 | Broken tool (waste) | — | Default | [`docs/recipes/smithing-recipes.md`](../recipes/smithing-recipes.md) |

## Bowcraft

| recipe_id | skill_id | required_level | xp | action_ticks | required_tool_tags | required_station_object_id | input_items | output_items | failure_mode | byproducts | unlock_condition | docs_source |
|-----------|----------|----------------|----|--------------|--------------------|---------------------------|-------------|--------------|--------------|------------|------------------|-------------|
| `cut-arrow-shafts` | bowcraft | 1 | 10 | 4 | knife | `lath-bow-bench` | `oldroad-oak-log` x1 | `arrow-shaft` x15 | Splinters (waste) | — | Default | [`docs/recipes/bowcraft-recipes.md`](../recipes/bowcraft-recipes.md) |
| `make-lathwood-bow-stave` | bowcraft | 1 | 15 | 5 | knife | `lath-bow-bench` | `oldroad-oak-log` x1 | `lathwood-bow-stave` x1 | Cracked stave (waste) | — | Default | [`docs/recipes/bowcraft-recipes.md`](../recipes/bowcraft-recipes.md) |
| `string-lathwood-shortbow` | bowcraft | 5 | 25 | 5 | — | `lath-bow-bench` | `lathwood-bow-stave` x1, `sinew-cord` x1 | `lathwood-shortbow` x1 | Snapped string (waste) | — | Default | [`docs/recipes/bowcraft-recipes.md`](../recipes/bowcraft-recipes.md) |
| `make-lathwood-arrows` | bowcraft | 3 | 20 | 4 | knife | `lath-bow-bench` | `arrow-shaft` x15, `bellfeathers` x15, `pennywrought-arrowhead` x15 | `lathwood-arrow` x15 | Broken arrows (waste) | — | Default | [`docs/recipes/bowcraft-recipes.md`](../recipes/bowcraft-recipes.md) |
| `make-lathwood-darts` | bowcraft | 7 | 22 | 4 | knife | `lath-bow-bench` | `arrow-shaft` x10, `bellfeathers` x10 | `lathwood-dart` x10 | Broken darts (waste) | — | Default | [`docs/recipes/bowcraft-recipes.md`](../recipes/bowcraft-recipes.md) |

## Beadwork

| recipe_id | skill_id | required_level | xp | action_ticks | required_tool_tags | required_station_object_id | input_items | output_items | failure_mode | byproducts | unlock_condition | docs_source |
|-----------|----------|----------------|----|--------------|--------------------|---------------------------|-------------|--------------|--------------|------------|------------------|-------------|
| `shape-bead-clay-blank` | beadwork | 1 | 10 | 4 | drill | `chalkhouse-bead-kiln` | `bead-clay` x1 | `bead-clay-blank` x1 | Cracked blank (waste) | — | Default | [`docs/recipes/beadwork-recipes.md`](../recipes/beadwork-recipes.md) |
| `drill-basic-bead` | beadwork | 1 | 12 | 4 | drill | `chalkhouse-bead-kiln` | `bead-clay-blank` x1 | `drilled-bead` x1 | Shattered bead (waste) | — | Default | [`docs/recipes/beadwork-recipes.md`](../recipes/beadwork-recipes.md) |
| `fire-chalkmarked-bead` | beadwork | 5 | 20 | 6 | glaze-bowl | `chalkhouse-bead-kiln` | `drilled-bead` x1, `glass-sand` x1 | `chalkmarked-bead` x1 | Scorched bead (waste) | — | Default | [`docs/recipes/beadwork-recipes.md`](../recipes/beadwork-recipes.md) |
| `string-basic-bead-strand` | beadwork | 3 | 15 | 4 | — | `chalkhouse-bead-loom` | `chalkmarked-bead` x5, `sinew-cord` x1 | `basic-bead-strand` x1 | Snapped strand (waste) | — | Default | [`docs/recipes/beadwork-recipes.md`](../recipes/beadwork-recipes.md) |
| `make-threadbare-bead-pouch` | beadwork | 8 | 25 | 5 | needle | `chalkhouse-bead-loom` | `torn-cloth` x3, `sinew-cord` x1 | `threadbare-bead-pouch` x1 | Torn pouch (waste) | — | Default | [`docs/recipes/beadwork-recipes.md`](../recipes/beadwork-recipes.md) |

## Tuning Note

> **XP values and action_ticks are provisional.** Balance during E09 implementation. Adjust based on loop timing, competition tests, and player feedback. Failure modes should be flavourful, not punishing.

## See also

- [`docs/recipes/recipe-system.md`](../recipes/recipe-system.md) — Recipe fields
- [`docs/recipes/recipe-chains.md`](../recipes/recipe-chains.md) — Starter chains
- [`docs/content/seed-items-manifest.md`](seed-items-manifest.md) — Required items
- [`docs/content/seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) — Required stations
- [`docs/content/seed-materials-manifest.md`](seed-materials-manifest.md) — Material inputs

---

*Last updated: 2026-05-31*

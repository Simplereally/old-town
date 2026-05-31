---
doc_type: manifest
canonical_path: docs/content/seed-materials-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/resources/00-index.md`
- `docs/resources/ores-and-stone.md`
- `docs/resources/woods-and-timber.md`
- `docs/content/seed-recipes-manifest.md`

# Seed Materials Manifest

> **Bridge `docs/resources/` into `content/materials/`.** Materials are a subset of items with a dedicated registry. They are the inputs to recipes and the outputs of gathering skills.

## Material Table

| material_id | display_name | source_skill | source_node_or_creature | tier_or_band | consumers | docs_source |
|-------------|--------------|--------------|-------------------------|--------------|-----------|-------------|
| `penny-copper` | Penny Copper | mining | `penny-copper-deposit` | 1 | `smelt-pennywrought-ingot`, `forge-pennywrought-shortblade` | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `tinstone` | Tinstone | mining | `tinstone-deposit` | 1 | `smelt-pennywrought-ingot` | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `pig-iron` | Pig Iron | mining | `pig-iron-outcrop` | 2 | `forge-pig-iron-gear` (post-POC) | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `blackcoal` | Blackcoal | mining | `blackcoal-pocket` | 4 | `smelt-pennywrought-ingot` (fuel), `apothecary-recipes` | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `wardenstone` | Wardenstone | mining | `wardenstone-deposit` (post-POC) | 5 | Post-POC smithing | [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) |
| `oldroad-oak` | Oldroad Oak | woodcutting | `oldroad-oak-tree` | 2 | `make-lathwood-bow-stave`, `cut-arrow-shafts` | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |
| `riverwillow` | Riverwillow | woodcutting | `riverwillow-tree` | 3 | Post-POC bowcraft | [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) |
| `bellfeather` | Bellfeather | trapping | `bird-lure-spot`, `bell-bat` | 1 | `make-lathwood-arrows`, `make-lathwood-darts` | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `rabbit-hide` | Rabbit Hide | trapping | `rabbit-snare-point` | 1 | `patchhide-coif`, `patchhide-jerkin`, `patchhide-chaps` | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `fox-hide` | Fox Hide | trapping | `bog-fox-track` | 2 | Post-POC tailoring | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `bead-clay` | Bead Clay | mining | `bead-clay-node` (post-POC) | 1 | `shape-bead-clay-blank`, `drill-basic-bead` | [`docs/resources/bead-materials.md`](../resources/bead-materials.md) |
| `glass-sand` | Glass Sand | mining | `glass-sand-node` (post-POC) | 1 | Post-POC beadwork | [`docs/resources/bead-materials.md`](../resources/bead-materials.md) |
| `graveyard-moss` | Graveyard Moss | gardening | `grave-flower-patch` | 1 | `cleanblood-salve`, `graveyard-tea` | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |
| `grave-flower` | Grave Flower | gardening | `grave-flower-patch` | 1 | `grave-flower-bundle`, `graveyard-tea` | [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) |
| `ditch-shrimp` | Ditch Shrimp | fishing | `ditch-shrimp-spot` | 1 | `cook-ditch-shrimp-skewer` | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |
| `tinfin` | Tinfin | fishing | `tinfin-ripple` | 2 | `make-tinfin-pie` | [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md) |
| `small-bone` | Small Bone | trapping | `rabbit-snare-point`, `cellar-rat` | 1 | `bone-needle`, `prayer-knot` | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |
| `grave-dust` | Grave Dust | trapping | `grave-mite` | 1 | `grave-bead`, `apothecary-recipes` | [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) |

## Consumer Summary

| Consumer Category | Recipes | Items |
|-------------------|---------|-------|
| Smithing | `smelt-pennywrought-ingot`, `forge-pennywrought-shortblade` | `pennywrought-shortblade`, `pennywrought-helm`, `pennywrought-ward` |
| Bowcraft | `make-lathwood-bow-stave`, `string-lathwood-shortbow`, `make-lathwood-arrows` | `lathwood-shortbow`, `lathwood-arrows` |
| Tailoring | `stitch-patchhide-coif`, `stitch-patchhide-jerkin`, `stitch-patchhide-chaps` | `patchhide-coif`, `patchhide-jerkin`, `patchhide-chaps` |
| Beadwork | `shape-bead-clay-blank`, `drill-basic-bead`, `fire-chalkmarked-bead` | `gust-bead`, `tide-bead`, `loam-bead`, `ember-bead`, `wit-bead` |
| Cooking | `cook-ditch-shrimp-skewer`, `bake-bellbread`, `make-tinfin-pie` | `ditch-shrimp-skewer`, `bellbread`, `tinfin-pie` |
| Apothecary | `make-cleanblood-salve`, `make-arms-tincture` | `cleanblood-salve`, `arms-tincture` |

## See also

- [`docs/resources/00-index.md`](../resources/00-index.md) — Resource taxonomy
- [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md) — Mining materials
- [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md) — Woodcutting materials
- [`docs/content/seed-items-manifest.md`](seed-items-manifest.md) — Item definitions
- [`docs/content/seed-recipes-manifest.md`](seed-recipes-manifest.md) — Recipe consumers

---

*Last updated: 2026-05-31*

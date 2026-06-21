---
doc_type: index
canonical_path: docs/resources/00-index.md
parent_index: docs/00-index.md
system_index: docs/resources/00-index.md
root_index: docs/00-index.md
---

Parent: [`Docs Index`](../00-index.md)

# Resources

> **The canonical resource taxonomy of Old Town.** Every material, ingredient, and commodity in the world is defined here. Skill docs and item docs must reference this authority for naming consistency.
>
> **Rule:** No resource name may be created outside this taxonomy without a documented exception. If a skill doc or item doc introduces a new material, it must be added here first.

---

## Resource Categories

| Document | Status | Description |
|----------|--------|-------------|
| [`resource-taxonomy.md`](resource-taxonomy.md) | Complete | Canonical resource names, tier ladder, and naming rules |
| [`ores-and-stone.md`](ores-and-stone.md) | Complete | Mining resources: ores, stone, glass sand, coal |
| [`woods-and-timber.md`](woods-and-timber.md) | Complete | Woodcutting resources: logs, kindling, bow woods |
| [`fish-and-cooking.md`](fish-and-cooking.md) | Complete | Fishing resources: fish, eels, shellfish, pearls |
| [`hides-bones-and-trophies.md`](hides-bones-and-trophies.md) | Complete | Trapping resources: hides, feathers, sinew, bones, trophies |
| [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) | Complete | Gardening resources: herbs, crops, dye plants, mushrooms |
| [`bead-materials.md`](bead-materials.md) | Complete | Beadwork resources: glass sand, minerals, foci, blanks |

---

## Quick Reference

| Resource | Category | Source Skill | Tier Key | Example Item ID |
|----------|----------|-------------|----------|----------------|
| Penny Copper | Ore | Mining | 1 | `penny_copper_ore` |
| Tinstone | Ore | Mining | 1 | `tinstone_ore` |
| Pig Iron Ore | Ore | Mining | 2 | `pig_iron_ore` |
| Blackcoal | Ore | Mining | 4 | `blackcoal` |
| Wardenstone | Ore | Mining | 5 | `wardenstone_ore` |
| Blackbar Seam | Ore | Mining | 6 | `blackbar_seam_ore` |
| Blueglass Ore | Ore | Mining | 8 | `blueglass_ore` |
| Starfall Ore | Ore | Mining | 12 | `starfall_ore` |
| Oldroad Oak | Wood | Woodcutting | 2 | `oldroad_oak_log` |
| Riverwillow | Wood | Woodcutting | 3 | `riverwillow_log` |
| Bellmaple | Wood | Woodcutting | 4 | `bellmaple_log` |
| Warden Yew | Wood | Woodcutting | 5 | `warden_yew_log` |
| Witchwood | Wood | Woodcutting | 8 | `witchwood_log` |
| Crownheart | Wood | Woodcutting | 11 | `crownheart_log` |
| Starfall Ash | Wood | Woodcutting | 12 | `starfall_ash_log` |
| Ditch Shrimp | Fish | Fishing | 1 | `raw_ditch_shrimp` |
| Tinfin | Fish | Fishing | 2 | `raw_tinfin` |
| Bell Herring | Fish | Fishing | 3 | `raw_bell_herring` |
| Brook Trout | Fish | Fishing | 4 | `raw_brook_trout` |
| Redback Salmon | Fish | Fishing | 6 | `raw_redback_salmon` |
| Rockclaw | Fish | Fishing | 8 | `raw_rockclaw` |
| Deepwater Eel | Fish | Fishing | 9 | `raw_deepwater_eel` |
| Glass Eel | Fish | Fishing | 10 | `raw_glass_eel` |
| Argent Ray | Fish | Fishing | 11 | `raw_argent_ray` |
| Crown Turtle | Fish | Fishing | 12 | `raw_crown_turtle` |
| Starfall Crab | Fish | Fishing | 12 | `raw_starfall_crab` |
| Rabbit Hide | Hide | Trapping | 1 | `rabbit_hide` |
| Drakebone | Bone | Trapping | 10 | `drakebone` |
| Drakeskin | Hide | Trapping | 10 | `drake_hide` |
| Graveyard Moss | Herb | Gardening | 1 | `graveyard_moss` |
| Warden Herb | Herb | Gardening | 5 | `warden_herb` |
| Blueglass Vial | Bead Material | Beadwork | 8 | `blueglass_vial` |
| Starfall Bead Blank | Bead Material | Beadwork | 12 | `starfall_bead_blank` |

---

## Naming Rules

1. **No generic fantasy names.** `mithril`, `adamantite`, `runite`, `dragon`, `shark`, `magic tree` are banned. Use the canonical names in this taxonomy.
2. **Kebab-case IDs.** All item IDs use lowercase with hyphens. `wardenstone_ore`, not `wardenstoneOre` or `WardenstoneOre`.
3. **Place names in resources.** Resources should evoke Old Town geography: `riverwillow`, `oldroad oak`, `bell herring`, `warden yew`.
4. **Tier names in endgame resources.** The top three tiers of any resource ladder use the cultural tier names: Blueglass, Carmine, Argent, Crownsteel, Starfall.
5. **Raw / cooked prefix.** Fish use `raw_` and `cooked_` prefixes. `raw_ditch_shrimp`, `cooked_ditch_shrimp`.
6. **No RS-coded items.** Any item name that would appear in RuneScape must be replaced with an Old Town equivalent.

---

## Related Documents

- [`../skills/00-index.md`](../skills/00-index.md) — Skills navigation hub
- [`../items/00-index.md`](../items/00-index.md) — Items navigation hub
- [`../items/resources/ore.md`](../items/resources/ore.md) — Ore item definitions
- [`../items/resources/wood.md`](../items/resources/wood.md) — Wood item definitions
- [`../items/resources/fish.md`](../items/resources/fish.md) — Fish item definitions
- [`../items/consumables/food.md`](../items/consumables/food.md) — Food item definitions

---

*Total resource categories: 7*
*Total canonical resources: 40+*
*Last updated: 2026-05-30*

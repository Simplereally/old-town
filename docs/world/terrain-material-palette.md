# Terrain Material Palette (design authority for E54)

Authoritative colour/parameter spec for the starter-world ground materials. E54-S01 implements
this against `content/materials/starter-materials.json` (schema:
`packages/shared/src/content-schemas/material.ts` — fields `color`, `accentColor` as ints,
`roughness`, optional `textureNoise { scale, amplitude }`, `category` from the schema enum).

**Important:** many "new" materials from the original plan already exist (`bellstone_plaza`,
`soot_cobble`, `chalk_flagstone`, `river_mud`, `patch_grass`, `quarry_grit`, `grave_soil`,
`oldroad_slabs`, `packed_road`, `water`, plus `grass_to_*` transitions). This palette **retunes**
those in place and adds only the genuinely missing ids. Never duplicate an existing id.

Colours are given as hex; store as decimal int (`0x8A8578` style literals are fine if the JSON
loader permits — otherwise decimal). `accentColor` is the noise/fleck colour.

## Retune existing (keep ids, update values)

| id | color | accentColor | roughness | textureNoise | category | Intent |
|---|---|---|---|---|---|---|
| `grass` | `#4F7A38` | `#69885E` | 0.90 | {6, 0.10} | grass | base meadow, slightly desaturated |
| `dirt_path` | `#7A6448` | `#8F7B5C` | 0.95 | {5, 0.12} | road | worn foot-track |
| `bellstone_plaza` | `#9A9182` | `#B0A896` | 0.80 | {3, 0.06} | plaza | warm flagstone, market heart |
| `oldroad_slabs` | `#847E70` | `#6E6A5E` | 0.85 | {2, 0.08} | road | big cool slabs, main street |
| `soot_cobble` | `#575149` | `#3A3733` | 0.95 | {4, 0.14} | road | Sootcellar approach, grimy |
| `chalk_flagstone` | `#CFC7B2` | `#D9D2C0` | 0.75 | {3, 0.05} | plaza | bright chalk court |
| `river_mud` | `#5E5038` | `#4A4030` | 1.00 | {5, 0.10} | soil | wet bank |
| `quarry_grit` | `#8B8175` | `#75695C` | 1.00 | {6, 0.15} | stone | foundry/quarry scatter |
| `grave_soil` | `#4E4436` | `#6F7D4A` | 1.00 | {5, 0.12} | soil | dark loam, moss accent |
| `patch_grass` | `#5E7A3A` | `#7A9048` | 0.90 | {6, 0.12} | grass | tended garden green |
| `packed_road` | `#6E5C42` | `#7F6F55` | 0.95 | {4, 0.08} | road | cart-packed earth |
| `water` | `#3E5E6E` | `#5E7E8A` | 0.30 | — | water | keep animated material params |

## New materials (add)

| id | color | accentColor | roughness | textureNoise | category | Use |
|---|---|---|---|---|---|---|
| `cobble_mossy` | `#6E6E5C` | `#6F7D4A` | 0.90 | {4, 0.12} | road | shrine + gate surrounds |
| `garden_loam` | `#5D4A33` | `#6E5A40` | 1.00 | {4, 0.10} | soil | garden plot surrounds |
| `riverbed_sand` | `#A89468` | `#B8A67C` | 0.85 | {5, 0.08} | soil | visible shallows edge |
| `river_gravel` | `#8A8478` | `#A09A8C` | 0.95 | {7, 0.14} | stone | bank shingle strips |
| `timber_deck` | `#5A4028` | `#7A5A3A` | 0.80 | {2, 0.06} | wood | dock + bridge walkway |
| `foundry_slag` | `#4A443E` | `#D97A3A` | 1.00 | {6, 0.10} | stone | ember-flecked forge yard |
| `graveyard_path` | `#5C564C` | `#6F7D4A` | 0.95 | {4, 0.10} | road | crypt approach |
| `wild_grass` | `#557040` | `#4A6238` | 0.95 | {8, 0.16} | grass | untended region edges |
| `orchard_grass` | `#5A7E44` | `#8FA060` | 0.90 | {6, 0.10} | grass | grove floors (Lath Yard) |
| `chalk_scree` | `#B8B09C` | `#CFC7B2` | 0.95 | {6, 0.12} | stone | chalk plateau skirts |

## Transitions

For every new material that borders `grass` in the layout, add a `grass_to_<id>` transition
entry following the existing `grass_to_*` pattern (midpoint colour, `category: "transition"`).
Required: `grass_to_cobble_mossy`, `grass_to_wild_grass` (subtle), `grass_to_orchard_grass`,
`grass_to_riverbed_sand`, `grass_to_graveyard_path`, `grass_to_garden_loam`, `grass_to_chalk_scree`.

## Zoning rule of thumb

One dominant ground per district, one accent, transitions only at borders: Market =
`bellstone_plaza`; Oldroad = `oldroad_slabs`; Foundry = `quarry_grit` + `foundry_slag` accent;
Lath Yard = `orchard_grass`; Patch Lane = `patch_grass` + `garden_loam`; Shrine = `cobble_mossy`;
Sootcellar = `soot_cobble`; Chalkhouse = `chalk_flagstone` + `chalk_scree`; River Stoop =
`river_mud`/`riverbed_sand`/`river_gravel`; Gravegate = `grave_soil` + `graveyard_path`;
wilds = `wild_grass`.

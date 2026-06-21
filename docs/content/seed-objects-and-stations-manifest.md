---
doc_type: manifest
canonical_path: docs/content/seed-objects-and-stations-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/map/station-placement.md`
- `docs/map/shop-and-service-placement.md`
- `docs/map/quest-object-placement.md`
- `docs/tools-and-intermediates/stations.md`

# Seed Objects and Stations Manifest

> **Landmarks, shops, stations, and quest objects.** Every object listed here must have a `content/objects/{object_id}.json` entry for the POC. Objects are the physical anchors of the world.

## Landmarks

| object_id | name | type | tile_size | collision_flags | options | linked_system | placement_source | docs_source |
|-----------|------|------|-----------|-----------------|---------|---------------|-------------------|-------------|
| `market-bell` | Market Bell | landmark | 2x2 | solid | Ring, Examine | Spawn point, town hub | [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md) | [`docs/world/starter-town.md`](../world/starter-town.md) |
| `oldroad-signpost` | Oldroad Signpost | landmark | 1x1 | solid | Read, Examine | Cartography routes | [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md) | [`docs/world/districts-and-routes.md`](../world/districts-and-routes.md) |
| `gravegate-arch` | Gravegate Arch | landmark | 3x1 | solid | Enter, Examine | Gravegate district threshold | [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md) | [`docs/world/districts-and-routes.md`](../world/districts-and-routes.md) |
| `sootcellar-hatch` | Sootcellar Hatch | landmark | 1x1 | solid | Open, Enter, Examine | Sootcellar entrance | [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md) | [`docs/world/districts-and-routes.md`](../world/districts-and-routes.md) |
| `counting-house-ledger-desk` | Counting House Ledger Desk | landmark | 2x1 | solid | Use, Examine | Bank, reclaim, ledger | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/ledger/civic-ledger-system.md`](../ledger/civic-ledger-system.md) |

## Shops and Service Objects

| object_id | name | type | tile_size | collision_flags | options | linked_system | placement_source | docs_source |
|-----------|------|------|-----------|-----------------|---------|---------------|-------------------|-------------|
| `counting-house-counter` | Counting House Counter | shop | 2x1 | solid | Trade, Examine | Bank, coin exchange | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `general-stall` | General Stall | shop | 2x1 | solid | Trade, Examine | General goods | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `penny-forge-counter` | Penny Forge Counter | shop | 2x1 | solid | Trade, Examine | Smithing tools, ore | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `lath-bowyer-counter` | Lath Bowyer Counter | shop | 2x1 | solid | Trade, Examine | Bowcraft supplies | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `patch-awl-counter` | Patch and Awl Counter | shop | 2x1 | solid | Trade, Examine | Tailoring supplies, hides | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `chalkhouse-counter` | Chalkhouse Counter | shop | 2x1 | solid | Trade, Examine | Beadwork supplies, magic tools | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `warden-board` | Warden Board | shop | 2x1 | solid | Read, Examine | Wardenry contracts | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |
| `shrine-hearth` | Shrine Hearth | shop | 2x2 | solid | Light, Offer, Examine | Favour, shrine rites | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/favour/shrines-and-rites.md`](../favour/shrines-and-rites.md) |
| `river-stoop-counter` | River Stoop Counter | shop | 2x1 | solid | Trade, Examine | Fish, cooking supplies | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |
| `sootcellar-blacksealed-door` | Sootcellar Blacksealed Door | shop | 1x1 | solid | Knock, Examine | Black market hints, Sleight | [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) | [`docs/economy/shop-system.md`](../economy/shop-system.md) |

## Stations

| object_id | name | type | tile_size | collision_flags | options | linked_system | placement_source | docs_source |
|-----------|------|------|-----------|-----------------|---------|---------------|-------------------|-------------|
| `foundry-furnace` | Foundry Furnace | station | 2x2 | solid | Smelt, Examine | Smithing, smelting | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `foundry-anvil` | Foundry Anvil | station | 2x1 | solid | Forge, Examine | Smithing, forging | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `lath-bow-bench` | Lath Bow Bench | station | 2x1 | solid | Whittle, Examine | Bowcraft, arrow making | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `patch-tanning-frame` | Patch Tanning Frame | station | 2x1 | solid | Cure, Examine | Tailoring, hide curing | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `patch-dye-vat` | Patch Dye Vat | station | 2x1 | solid | Dye, Examine | Tailoring, dyeing | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `chalkhouse-bead-kiln` | Chalkhouse Bead Kiln | station | 2x2 | solid | Fire, Examine | Beadwork, bead firing | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `chalkhouse-bead-loom` | Chalkhouse Bead Loom | station | 2x1 | solid | String, Examine | Beadwork, bead stringing | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `market-kitchen-hearth` | Market Kitchen Hearth | station | 2x2 | solid | Cook, Examine | Cooking, food prep | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `apothecary-bench` | Apothecary Bench | station | 2x1 | solid | Mix, Examine | Apothecary, potion making | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |
| `map-table` | Map Table | station | 2x1 | solid | Survey, Examine | Cartography, map copying | [`docs/map/station-placement.md`](../map/station-placement.md) | [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) |

## Quest Objects

| object_id | name | type | tile_size | collision_flags | options | linked_system | placement_source | docs_source |
|-----------|------|------|-----------|-----------------|---------|---------------|-------------------|-------------|
| `old-kiln` | Old Kiln | quest | 3x3 | solid | Inspect, Examine | Smoke Over Old Town quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md) |
| `smoke-vent` | Smoke Vent | quest | 1x1 | none | Inspect, Examine | Smoke Over Old Town quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md) |
| `rat-chewed-ledger` | Rat-Chewed Ledger | quest | 1x1 | none | Read, Examine | Rats Under Tally's quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/rats-under-tallys.md`](../quests/rats-under-tallys.md) |
| `broken-anvil-plate` | Broken Anvil Plate | quest | 1x1 | solid | Inspect, Examine | A Penny for the Forge quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/a-penny-for-the-forge.md`](../quests/a-penny-for-the-forge.md) |
| `split-bow-stave` | Split Bow Stave | quest | 1x1 | none | Inspect, Examine | String Enough to Sing quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/string-enough-to-sing.md`](../quests/string-enough-to-sing.md) |
| `listening-clay-node` | Listening Clay Node | quest | 1x1 | none | Gather, Examine | The Beadwife's Errand quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/the-beadwifes-errand.md`](../quests/the-beadwifes-errand.md) |
| `wrongly-planted-flower` | Wrongly Planted Flower | quest | 1x1 | none | Dig, Examine | Gravegate Flowers quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/gravegate-flowers.md`](../quests/gravegate-flowers.md) |
| `bell-clapper-hook` | Bell Clapper Hook | quest | 1x1 | none | Take, Examine | The Missing Bell-Clapper quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/the-missing-bell-clapper.md`](../quests/the-missing-bell-clapper.md) |
| `sooted-receipt` | Sooted Receipt | quest | 1x1 | none | Read, Examine | Smoke Over Old Town quest | [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) | [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md) |

## See also

- [`docs/map/station-placement.md`](../map/station-placement.md) — Station tiles
- [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md) — Shop placements
- [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) — Quest object anchors
- [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) — Station system
- [`docs/content/seed-resource-nodes-manifest.md`](seed-resource-nodes-manifest.md) — Resource nodes

---

*Last updated: 2026-05-31*

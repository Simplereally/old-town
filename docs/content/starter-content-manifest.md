---
doc_type: authority
canonical_path: docs/content/starter-content-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/content-translation-system.md`
- `docs/content/schema-gap-analysis.md`
- `docs/map/first-30-minute-paths.md`
- `docs/quests/starter-quest-arc.md`

# Starter Content Manifest

> **Minimum content set for the first playable vertical slice.** This manifest defines what must exist in content JSON for the POC to be playable. Anything not listed here is post-POC.

## Required Districts

All 13 starter districts need content entries for objects, NPCs, and resource nodes.

| District | Content Needed | Schema Gap? |
|----------|---------------|-------------|
| Market Bell | Landmark, spawn point, NPC, shop objects | No |
| Counting House | Bank object, NPC, service point | No |
| Foundry Row | Station objects, NPC, shop object, resource nodes | No |
| Lath Yard | Station objects, NPC, shop object, resource nodes | No |
| Patch Lane | Station objects, NPC, shop object, resource nodes | No |
| Chalkhouse Court | Station objects, NPC, shop object, resource nodes | No |
| Warden Steps | NPC, contract board, combat spawn zone | No |
| Shrine Hearth | NPC, shrine object, Favour point | Partial (Favour boons are schema gap) |
| River Stoop | NPC, shop object, fishing nodes, cooking station | No |
| Oldroad Gate | NPC, map table, woodcutting nodes | No |
| Gravegate | NPC, danger spawn zone, gardening nodes | No |
| Sootcellar | NPC, danger spawn zone, quest objects | No |
| North Quarry Road | Resource nodes, danger spawn zone | No |

## Required Starter Loops

6 loops from [`docs/map/first-30-minute-paths.md`](../map/first-30-minute-paths.md). Each loop needs items, recipes, stations, and NPCs.

| Loop | Name | Skills Taught | Content Needed |
|------|------|---------------|----------------|
| A | Spawn to Bank to Rats | Movement, banking, first combat | NPC, creature spawns, bank object |
| B | Full Penny | Mining, Smithing | Resource nodes, recipes, stations, tools, NPC |
| C | Full Lath | Woodcutting, Bowcraft | Resource nodes, recipes, stations, tools, NPC |
| D | Full Patch | Trapping, Tailoring | Resource nodes, recipes, stations, tools, NPC |
| E | Full Chalk | Beadwork, Magic | Resource nodes, recipes, stations, tools, NPC |
| F | First Mystery | Sleight, Cartography | Quest, NPCs, objects, dialogue |

## Required First Quests

7 quests from the starter arc.

| Quest | Giver NPC | Content Needed | Schema Gap? |
|-------|-----------|---------------|-------------|
| Smoke Over Old Town | Pippa Hearth | Quest JSON, dialogue, quest objects | No |
| Rats Under Tally's | Warden Holt | Quest JSON, dialogue, creature spawns, drop table | No |
| A Penny for the Forge | Osric Penny | Quest JSON, dialogue, recipes, items | No |
| String Enough to Sing | Letha Lath | Quest JSON, dialogue, recipes, items | No |
| The Beadwife's Errand | Mother Tallow | Quest JSON, dialogue, recipes, items | No |
| Gravegate Flowers | Gravekeeper Soll | Quest JSON, dialogue, gardening nodes, items | No |
| The Missing Bell-Clapper | Mara Bellkeeper | Quest JSON, dialogue, objects, items | No |

## Required First Systems

14 systems that need content JSON for the POC.

| System | Content Kind | Required for POC? | Notes |
|--------|--------------|-------------------|-------|
| Skills | `skill` | Yes | 25 skills, all 1-99 |
| Items | `item` | Yes | Starter gear, tools, resources, consumables |
| Materials | `material` | Yes | Subset of items for recipe inputs |
| Objects | `object` | Yes | Stations, landmarks, shops, quest objects |
| Resource Nodes | `resourceNode` | Yes | Mining, wood, fish, trap, garden nodes |
| Recipes | `processingRecipe` | Yes | Cooking, smithing, bowcraft, beadwork |
| NPCs | `npc` | Yes | 14 service NPCs |
| Creatures | `npc` (creature kind) | Yes | 12 starter creatures |
| Drop Tables | `dropTable` | Yes | One per creature |
| Quests | `quest` | Yes | 7 starter quests |
| Dialogue | `dialogue` | Yes | One pack per quest giver |
| Region Map | `regionMap` | Yes | `old-town-core` 96x96 |
| Shops | Schema gap | Partial | Shop stock schema needed; defer if not ready |
| Services | Schema gap | Partial | Service fee schema needed; defer if not ready |

## POC Readiness Checklist

### Batch 1: Foundational Definitions (Completed)

- [x] All 25 skills have `content/skills/*.json` entries — 29 skills total (including existing OSRS-era placeholders)
- [x] All starter items have `content/items/*.json` entries — 79 items total across 8 files
- [x] All starter materials have `content/materials/*.json` entries — 23 materials total
- [x] All starter objects have `content/objects/*.json` entries — 42 objects total
- [x] All starter resource nodes have `content/resource-nodes/*.json` entries — 20 nodes total
- [x] All starter recipes have `content/processing-recipes/*.json` entries — 17 recipes total
- [x] `bun run content:validate` passes with zero errors — 25 content files validated
- [x] `bun run test` passes with all content tests green — 537 tests passed
- [x] `bun run typecheck` passes — all 5 workspaces clean
- [x] `bun run format:check` passes — all files formatted

### Batch 2A: NPCs, Creatures, Drops, Quests, Dialogue (Completed)

- [x] All 14 service NPCs have `content/npcs/*.json` entries — 26 NPCs total (14 service + 12 creatures)
- [x] All 12 starter creatures have `content/npcs/*.json` entries — combat stats, drops, and options defined
- [x] All 11 starter drop tables have `content/drops/*.json` entries — 13 drop tables total (including existing)
- [x] All 7 quests have `content/quests/*.json` entries — schema-valid quest shells with stages and rewards
- [x] All 14 dialogue packs have `content/dialogue/*.json` entries — 15 dialogue graphs total (including existing)
- [x] `bun run content:validate` passes with zero errors — 27 content files validated
- [x] `bun run test` passes with all content tests green — 545 tests passed
- [x] `bun run typecheck` passes — all 5 workspaces clean
- [x] `bun run format:check` passes — all files formatted

### Batch 2B: Map JSON (Completed)

- [x] Four 64×64 runtime region files replace the old placeholder:
  - `content/maps/old-town-0-0-0.json` — region (0,0): global x 0-63, y 0-63
  - `content/maps/old-town-1-0-0.json` — region (1,0): global x 64-127, y 0-63
  - `content/maps/old-town-0-1-0.json` — region (0,1): global x 0-63, y 64-127
  - `content/maps/old-town-1-1-0.json` — region (1,1): global x 64-127, y 64-127 (buffer)
- [x] 96×96 design-space Old Town occupies global x 0-95, y 0-95 inside the 128×128 envelope
- [x] 14 service NPCs placed with `wanderRadius: 0`
- [x] 28 creature spawns placed conservatively (no hostile spawns in safe zones)
- [x] 32 objects placed (landmarks, service counters, stations, quest objects)
- [x] 1 ground item spawn (`pennywrought_pickaxe` at 48,76)
- [x] 23 district triggers covering all 13 core districts + player spawn + death respawn
- [x] 11 terrain underlay materials added to `content/materials/starter-materials.json`
- [x] `bun run content:validate` passes — 30 files, 0 errors
- [x] `bun run test` passes — 551 tests green
- [x] `bun run typecheck` passes — all 5 workspaces clean
- [x] `bun run format:check` passes — all files formatted

**Implementation:** Generator script `scripts/generate-old-town-map.ts` converts design-space global coordinates to runtime region/local coordinates, splits placements across four region files, validates IDs, and emits sorted stable JSON.

**Schema gaps documented:**
- Resource node placement: the region-map schema has no `resourceNodeSpawns` array. Resource nodes are represented as objects with `resourceNodeId` where the object schema supports it. Authoritative resource node positions remain in `docs/map/resource-node-placement.md`.
- Player spawn / death respawn: represented as area triggers (`player_spawn_market_bell`, `death_respawn_counting_house`) since the schema has no dedicated `spawnTile` field.
- Collision: minimal collision authored for Batch 2B. A future E14 collision-authoring pass will add full directional bitmask collision.
- Shop/service stock: no dedicated shop JSON yet. Service NPCs use `trade` and `bank` action IDs on existing object counters.

## See also

- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow
- [`docs/content/schema-gap-analysis.md`](schema-gap-analysis.md) — Schema gaps
- [`docs/content/seed-*.md`](00-index.md) — Detailed seed manifests
- [`docs/map/first-30-minute-paths.md`](../map/first-30-minute-paths.md) — Starter loops
- [`docs/quests/starter-quest-arc.md`](../quests/starter-quest-arc.md) — Quest arc

---

*Last updated: 2026-05-31*

---
doc_type: manifest
canonical_path: docs/content/seed-npcs-and-creatures-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/world/npc-cast.md`
- `docs/creatures/starter-creatures.md`
- `docs/spatial/movement-ecology.md`
- `docs/spatial/monster-movement-and-leashing.md`
- `docs/map/npc-placement.md`
- `docs/map/creature-spawn-placement.md`

# Seed NPCs and Creatures Manifest

> **Service NPCs and starter creatures.** Every NPC and creature listed here must have a `content/npcs/{npc_id}.json` entry. NPCs and creatures share the NPC directory with a `kind` field.

## Service NPCs

| npc_id | display_name | kind | combat_level_if_any | size_tiles | movement_type | aggression_type | attack_style_if_any | drop_table_id_if_any | dialogue_id_if_any | shop_or_service_id_if_any | home_zone_or_tile | docs_source |
|--------|--------------|------|---------------------|------------|---------------|-----------------|---------------------|----------------------|--------------------|--------------------------|-------------------|-------------|
| `mara-bellkeeper` | Mara Bellkeeper | service | — | 1x1 | static | passive | — | — | `mara-bellkeeper-arrival` | — | Market Bell (48, 48) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `tomas-tally` | Tomas Tally | service | — | 1x1 | static | passive | — | — | `tomas-tally-rats-under-tallys` | `counting-house-counter` | Counting House (36, 48) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `osric-penny` | Osric Penny | service | — | 1x1 | static | passive | — | — | `osric-penny-forge-intro` | `penny-forge-counter` | Foundry Row (60, 48) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `letha-lath` | Letha Lath | service | — | 1x1 | static | passive | — | — | `letha-lath-bowcraft-intro` | `lath-bowyer-counter` | Lath Yard (48, 60) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `nell-patch` | Nell Patch | service | — | 1x1 | static | passive | — | — | `nell-patch-tailoring-intro` | `patch-awl-counter` | Patch Lane (48, 32) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `mother-tallow` | Mother Tallow | service | — | 1x1 | static | passive | — | — | `mother-tallow-beadwife-intro` | `chalkhouse-counter` | Chalkhouse Court (32, 64) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `warden-holt` | Warden Holt | service | — | 1x1 | static | passive | — | — | `warden-holt-contracts` | `warden-board` | Warden Steps (64, 64) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `sister-writ` | Sister Writ | service | — | 1x1 | static | passive | — | — | `sister-writ-shrine-intro` | `shrine-hearth` | Shrine Hearth (32, 48) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `finch-quill` | Finch Quill | service | — | 1x1 | static | passive | — | — | `finch-quill-cartography-intro` | — | Oldroad Gate (16, 48) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `edda-tinfin` | Edda Tinfin | service | — | 1x1 | static | passive | — | — | `edda-tinfin-fishmonger` | `river-stoop-counter` | River Stoop (64, 32) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `bramble-hook` | Bramble Hook | service | — | 1x1 | static | passive | — | — | `bramble-hook-fishing-tools` | — | River Stoop (66, 32) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `marn-lock` | Marn Lock | service | — | 1x1 | static | passive | — | — | `marn-lock-bell-clapper` | `sootcellar-blacksealed-door` | Sootcellar (32, 32) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `pippa-hearth` | Pippa Hearth | service | — | 1x1 | static | passive | — | — | `pippa-hearth-smoke-over-old-town` | `market-kitchen-hearth` | Market Bell (44, 52) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |
| `gravekeeper-soll` | Gravekeeper Soll | service | — | 1x1 | static | passive | — | — | `gravekeeper-soll-gravegate-flowers` | — | Gravegate (64, 16) | [`docs/world/npc-cast.md`](../world/npc-cast.md) |

## Starter Creatures

| npc_id | display_name | kind | combat_level_if_any | size_tiles | movement_type | aggression_type | attack_style_if_any | drop_table_id_if_any | dialogue_id_if_any | shop_or_service_id_if_any | home_zone_or_tile | docs_source |
|--------|--------------|------|---------------------|------------|---------------|-----------------|---------------------|----------------------|--------------------|--------------------------|-------------------|-------------|
| `cellar-rat` | Cellar Rat | creature | 1 | 1x1 | wander_small | passive | melee | `cellar-rat-drops` | — | — | Sootcellar (24-40, 24-40) | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `soot-rat` | Soot Rat | creature | 3 | 1x1 | wander_small | passive | melee | `soot-rat-drops` | — | — | Sootcellar deeper rooms | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `stray-dog` | Stray Dog | creature | 2 | 1x1 | patrol | reactive | melee | `stray-dog-drops` | — | — | Alleys / Oldroad Gate | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `mud-goblin` | Mud Goblin | creature | 5 | 1x1 | wander_medium | aggressive | melee | `mud-goblin-drops` | — | — | North Quarry Road | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `bell-bat` | Bell Bat | creature | 4 | 1x1 | fly_circle | reactive | melee | `bell-bat-drops` | — | — | Roofs / old bell tower | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `bog-fox` | Bog Fox | creature | 6 | 1x1 | flee_then_turn | reactive | melee | `bog-fox-drops` | — | — | South fields / Patch Lane edge | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `grave-mite` | Grave Mite | creature | 3 | 1x1 | burrow_emerge | aggressive | melee | `grave-mite-drops` | — | — | Gravegate edge | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `grave-wisp` | Grave Wisp | creature | 8 | 1x1 | float_drift | aggressive | magic | `grave-wisp-drops` | — | — | Gravegate / Shrine edge | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `ash-drake-whelp` | Ash Drake Whelp | creature | 12 | 2x2 | wander_small | aggressive | melee + fire | `ash-drake-whelp-drops` | — | — | Old kiln / rare Sootcellar | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `blacksealed-cutpurse` | Blacksealed Cutpurse | creature | 7 | 1x1 | patrol | aggressive | melee | `blacksealed-cutpurse-drops` | — | — | Market alleys | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `road-crow` | Road Crow | creature | 1 | 1x1 | fly_random | passive | melee | `road-crow-drops` | — | — | Oldroad Gate | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |
| `river-snapper` | River Snapper | creature | 4 | 1x1 | static_bob | reactive | melee | `river-snapper-drops` | — | — | River Stoop bank | [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) |

## Movement and Aggression Notes

- **Movement types** from [`docs/spatial/movement-ecology.md`](../spatial/movement-ecology.md): static, wander_small, wander_medium, patrol, flee_then_turn, fly_circle, fly_random, burrow_emerge, float_drift, static_bob.
- **Aggression types** from [`docs/spatial/monster-movement-and-leashing.md`](../spatial/monster-movement-and-leashing.md): passive (never attacks first), reactive (attacks if provoked), aggressive (attacks on sight).
- Starter creatures must not block starter skilling. They should pressure better nodes, shortcuts, quest spaces, and deeper routes.

## See also

- [`docs/world/npc-cast.md`](../world/npc-cast.md) — NPC details
- [`docs/creatures/starter-creatures.md`](../creatures/starter-creatures.md) — Creature stats
- [`docs/spatial/monster-movement-and-leashing.md`](../spatial/monster-movement-and-leashing.md) — Movement and aggression
- [`docs/map/npc-placement.md`](../map/npc-placement.md) — NPC tiles
- [`docs/map/creature-spawn-placement.md`](../map/creature-spawn-placement.md) — Creature spawn zones
- [`docs/content/seed-drops-and-contracts-manifest.md`](seed-drops-and-contracts-manifest.md) — Drop tables

---

*Last updated: 2026-05-31*

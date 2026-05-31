---
doc_type: manifest
canonical_path: docs/content/seed-map-and-spawns-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/map/old-town-starter-region.md`
- `docs/map/district-boundaries.md`
- `docs/spatial/safe-danger-gradient.md`
- `docs/map/first-30-minute-paths.md`

# Seed Map and Spawns Manifest

> **Bridge `docs/map/` and `docs/spatial/` into `content/maps/old-town-core.json`.** This manifest defines the logical placement truth for the starter region. The world-editor consumes this to generate the final tilemap.

## Region Definition

| Field | Value |
|-------|-------|
| **region_id** | `old-town` (four-region runtime envelope) |
| **runtime_size** | 128 x 128 tiles (four 64×64 regions) |
| **design_space_size** | 96 x 96 tiles |
| **plane** | 0 |
| **spawn_tile** | (48, 50) — Market Bell |
| **death_respawn_tile** | (48, 37) — Counting House |

## Runtime Region Files

| Region File | rx | ry | Global x Range | Global y Range | Contents |
|-------------|----|----|----------------|----------------|----------|
| `old-town-0-0-0.json` | 0 | 0 | 0–63 | 0–63 | Oldroad Gate, Shrine Hearth, Counting House, Market Bell, Sootcellar, Patch Lane, Chalkhouse Court |
| `old-town-1-0-0.json` | 1 | 0 | 64–127 | 0–63 | Foundry Row, Lath Yard, Warden Steps, River Stoop, Gravegate |
| `old-town-0-1-0.json` | 0 | 1 | 0–63 | 64–127 | North Quarry Road |
| `old-town-1-1-0.json` | 1 | 1 | 64–127 | 64–127 | Buffer / future expansion |

**Coordinate conversion:** `rx = floor(x / 64)`, `ry = floor(y / 64)`, `local_x = x % 64`, `local_y = y % 64`.

## District Bounds

All bounding boxes use half-open intervals: [x_min, x_max) and [y_min, y_max).

| District | x_min | x_max | y_min | y_max | Area (tiles) |
|----------|-------|-------|-------|-------|--------------|
| Market Bell | 40 | 56 | 40 | 56 | 256 |
| Counting House | 32 | 40 | 44 | 52 | 64 |
| Foundry Row | 56 | 72 | 40 | 56 | 256 |
| Lath Yard | 40 | 56 | 56 | 72 | 256 |
| Patch Lane | 40 | 56 | 24 | 40 | 256 |
| Chalkhouse Court | 24 | 40 | 56 | 72 | 256 |
| Warden Steps | 56 | 72 | 56 | 72 | 256 |
| Shrine Hearth | 24 | 40 | 40 | 56 | 256 |
| River Stoop | 56 | 72 | 24 | 40 | 256 |
| Oldroad Gate | 8 | 24 | 40 | 56 | 256 |
| Gravegate | 56 | 72 | 8 | 24 | 256 |
| Sootcellar | 24 | 40 | 24 | 40 | 256 |
| North Quarry Road | 40 | 56 | 72 | 88 | 256 |

## Safe Zones

| Zone | Districts | Notes |
|------|-----------|-------|
| Town core | Market Bell, Counting House, Foundry Row, Lath Yard, Patch Lane, Chalkhouse Court | No aggressive creatures. All NPCs are service NPCs. |
| Shrine buffer | Shrine Hearth | Safe but adjacent to danger. |
| River bank | River Stoop | Safe but has reactive creatures (river snapper). |
| Oldroad entry | Oldroad Gate | Safe but has reactive creatures (stray dog, road crow). |

## Danger Zones

| Zone | Districts | Notes |
|------|-----------|-------|
| Sootcellar | Sootcellar | Passive creatures (rats) that become dangerous in groups. |
| Quarry road | North Quarry Road | Aggressive creature (mud goblin). |
| Gravegate edge | Gravegate | Aggressive and magic-resistant creatures (grave mite, grave wisp). |
| South fields | Patch Lane edge | Reactive creature (bog fox). |
| Market alleys | Market Bell alleys | Aggressive creature (blacksealed cutpurse). |

## Collision Overrides

| Override | Location | Rule |
|----------|----------|------|
| Main roads | Between districts | 3-5 tiles wide, no collision |
| Shop doors | Shop objects | 2+ tiles wide, no collision |
| Station adjacency | Station objects | 2+ adjacent interactable tiles |
| Quest object clear | Quest objects | 1 tile clear in all directions |

## Placement Categories (Runtime Map)

| Category | Count | Source Manifest |
|----------|-------|-----------------|
| Object placements | 32 | [`seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) |
| Service NPC placements | 14 | [`seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) |
| Creature spawn placements | 28 | [`seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) |
| Ground item placements | 1 | [`seed-items-manifest.md`](seed-items-manifest.md) |
| District triggers | 23 | `docs/map/district-boundaries.md` |
| Quest object placements | 9 | [`seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) |

**Note:** Resource node placements (16) are not directly placed in map JSON because the region-map schema lacks a `resourceNodeSpawns` array. They are represented as objects with `resourceNodeId` where supported. Authoritative positions remain in `docs/map/resource-node-placement.md`.

## Art Note

> **This is logical placement truth, not art tiles.** The world-editor will consume this manifest to generate the final tilemap. Visual ground types, object models, and NPC sprites are defined in the renderer, not in this manifest.

## See also

- [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md) — Region overview
- [`docs/map/district-boundaries.md`](../map/district-boundaries.md) — Exact bounding boxes
- [`docs/spatial/safe-danger-gradient.md`](../spatial/safe-danger-gradient.md) — Zone safety
- [`docs/map/first-30-minute-paths.md`](../map/first-30-minute-paths.md) — Route objects
- [`docs/content/seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) — Object definitions
- [`docs/content/seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) — NPC and creature definitions
- [`docs/content/seed-resource-nodes-manifest.md`](seed-resource-nodes-manifest.md) — Resource node definitions

---

*Last updated: 2026-05-31*

---
doc_type: authority
canonical_path: docs/map/district-boundaries.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/map/map-placement-system.md`
- `docs/map/old-town-starter-region.md`
- `docs/world/districts-and-routes.md`

# District Boundaries

All bounding boxes use half-open intervals: [x_min, x_max) and [y_min, y_max). A tile is inside the district if x_min <= tile_x < x_max and y_min <= tile_y < y_max. Area equals (x_max - x_min) * (y_max - y_min).

## Bounding Box Table

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

## Coverage Summary

- Total district area: 3,136 tiles
- Region area: 9,216 tiles (96 x 96)
- District coverage: 34%
- Remaining space: roads, alleys, walls, cliffs, open ground, and future expansion buffers

## Adjacency Map

| District | Touches (shares edge) |
|----------|----------------------|
| Market Bell | Counting House, Foundry Row, Lath Yard, Patch Lane |
| Counting House | Market Bell, Shrine Hearth, Oldroad Gate |
| Foundry Row | Market Bell, Lath Yard, Warden Steps, River Stoop |
| Lath Yard | Market Bell, Foundry Row, Chalkhouse Court, Warden Steps, North Quarry Road |
| Patch Lane | Market Bell, Sootcellar, Gravegate |
| Chalkhouse Court | Lath Yard, Warden Steps, Shrine Hearth |
| Warden Steps | Foundry Row, Lath Yard, Chalkhouse Court, River Stoop |
| Shrine Hearth | Counting House, Chalkhouse Court, Oldroad Gate, Sootcellar |
| River Stoop | Foundry Row, Warden Steps, Gravegate |
| Oldroad Gate | Counting House, Shrine Hearth |
| Gravegate | Patch Lane, River Stoop |
| Sootcellar | Patch Lane, Shrine Hearth |
| North Quarry Road | Lath Yard |

## Design Notes

- Counting House is intentionally small. It is a bank, not a district.
- North Quarry Road has only one adjacency, by design. It is a destination, not a through-route.
- Gravegate touches River Stoop to create a dangerous shortcut between southeast and south.
- Sootcellar touches both Patch Lane and Shrine Hearth, giving it two surface entrances.

---

*Last updated: 2026-05-31*

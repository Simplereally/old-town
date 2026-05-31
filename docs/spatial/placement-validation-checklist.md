---
doc_type: authority
canonical_path: docs/spatial/placement-validation-checklist.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/spatial/00-index.md`
- `docs/map/00-index.md`
- `POC_SPEC.md`

# Placement Validation Checklist

This checklist is run before any story that modifies spatial placement is marked complete. Every item must pass. A single failure blocks completion.

## Validation Rules

1. **Every district has a landmark.** Each of the 13 starter districts has one silhouette object that is visible from the approach road.
2. **Every district has a revisit reason.** A player must want to return to every district after their first visit. Reason may be: shop, station, NPC, resource, quest, or shortcut.
3. **Every NPC is within sight of a station.** No essential NPC is placed so far from a skilling station that a new player would not discover the station by walking to the NPC.
4. **Starter nodes are safe.** No hostile spawn has its home point within 3 tiles of a starter resource node (copper, ash, shrimp, etc.).
5. **Better nodes have danger.** Advanced resource nodes (tinstone, oak, trout, etc.) have creature pressure within 5 tiles. The pressure is proximity, not obstruction.
6. **Monsters do not block essentials.** No hostile spawn zone overlaps a shop door, bank tile, station interact tile, or quest object tile.
7. **Each creature has movement, leash, aggression, and safe data.** Every creature in content JSON has: movement_type, wander_radius, aggro_radius, chase_radius, leash_radius, return_behavior, and safe_reset_boundary.
8. **Every quest has a placed anchor.** Every quest in the starter arc has at least one physical object, NPC, or zone that the player can walk to and recognise as quest-related.
9. **Every loop is walkable.** All 6 starter loops from [`first-30-minute-paths.md`](../map/first-30-minute-paths.md) can be completed without crossing untraversable collision or passing through dense hostile zones on the outbound leg.
10. **Every route has a visual cue.** Every named road, alley, and shortcut has a ground type, signpost, or landmark that makes it recognisable.
11. **Every district has a shorthand name.** A player can describe the district in 2-3 words that sound like local speech. "The Bell", "The Counting House", "The Patch", "The Grave", etc.
12. **No generic names.** No district, road, or area uses a banned naming pattern from [`naming-atlas.md`](naming-atlas.md).
13. **Safe and danger are visible.** Every zone transition from safe to dangerous has at least one readable danger marker from [`safe-danger-gradient.md`](safe-danger-gradient.md).
14. **Chokepoints are intentional.** Every 1-tile or 2-tile narrow passage has a documented design purpose in [`traversal-and-chokepoints.md`](traversal-and-chokepoints.md).
15. **POC is playable without external map.** A new player can reach every essential NPC, station, shop, and starter resource node by following roads and landmarks. No wiki or map required.

## Validation Commands

Run these commands after any spatial placement change:

- `bun run test` — All tests pass
- `bun run lint` — No lint errors
- `bun run typecheck` — No type errors
- `bun run content:validate` — All content JSON validates against schemas

## See also

- [`docs/spatial/00-index.md`](00-index.md) — Spatial directory entry point
- [`docs/map/00-index.md`](../map/00-index.md) — Map coordinate authority
- [`docs/map/first-30-minute-paths.md`](../map/first-30-minute-paths.md) — Starter loop validation

---

*Last updated: 2026-05-31*

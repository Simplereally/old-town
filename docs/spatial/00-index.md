---
doc_type: authority
canonical_path: docs/spatial/00-index.md
parent_index: docs/00-index.md
root_index: docs/00-index.md
---

Parent: [`Documentation Index`](../00-index.md)

Authority references:
- `docs/map/00-index.md`
- `docs/world/starter-town.md`
- `docs/world/districts-and-routes.md`
- `docs/content/content-translation-system.md`
- `docs/content/seed-map-and-spawns-manifest.md`
- `POC_SPEC.md`

# Spatial Simulation + Naming Atlas

Terrain grammar, movement ecology, monster behaviour, and cultural naming for Old Town.

This directory is the authoritative source of truth for all terrain, movement, danger, and naming. It refines the coordinate-level map docs into a playable spatial simulation with rules for how the world feels, moves, and threatens.

The authoritative source of truth for all coordinates, bounding boxes, and exact tile placements remains [`docs/map/00-index.md`](../map/00-index.md). This directory adds the layer of spatial behaviour, danger grammar, and cultural naming on top of those coordinates.

## Leaf Documents

| Document | Status | Summary |
|----------|--------|---------|
| [`spatial-system.md`](spatial-system.md) | Complete | The 6 conceptual spatial layers and the rule that every danger needs a visible threshold |
| [`terrain-grammar.md`](terrain-grammar.md) | Complete | Ground types, object density rules, and the 8x8 chunk content rule |
| [`movement-ecology.md`](movement-ecology.md) | Complete | 10 movement types for NPCs and creatures, with the ban on random walk forever |
| [`monster-movement-and-leashing.md`](monster-movement-and-leashing.md) | Complete | Aggression types, leash rules, and starter creature spatial behaviour |
| [`spawn-density-and-pressure.md`](spawn-density-and-pressure.md) | Complete | Density bands and starter area spawn rules |
| [`safe-danger-gradient.md`](safe-danger-gradient.md) | Complete | Emotional danger gradient and readable danger markers |
| [`traversal-and-chokepoints.md`](traversal-and-chokepoints.md) | Complete | Road widths, door rules, and chokepoint design |
| [`landmarks-and-silhouettes.md`](landmarks-and-silhouettes.md) | Complete | District silhouettes and the screenshot recognition rule |
| [`naming-atlas.md`](naming-atlas.md) | Complete | Cultural naming grammar, good patterns, banned patterns, and starter outer area names |
| [`outer-area-seeds.md`](outer-area-seeds.md) | Complete | First and second ring expansion areas with future roles |
| [`placement-validation-checklist.md`](placement-validation-checklist.md) | Complete | 15 validation rules for every district, route, and spawn placement |

## Design Rule Summary

1. Every danger must have a visible threshold before it becomes mechanically dangerous.
2. Random walk forever is banned unless explicitly chosen for harmless flavour NPCs.
3. Names must sound like locals would say them. No generic fantasy names.
4. If a screenshot shows only silhouette and ground colour, the district should still be recognisable.
5. Starter nodes are safe. Better nodes have danger. Monsters never block essentials.
6. Every tile cluster needs a purpose: roads move players, alleys hide shortcuts, cellars compress danger, gates mark thresholds.

---

*Last updated: 2026-05-31*

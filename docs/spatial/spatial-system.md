---
doc_type: authority
canonical_path: docs/spatial/spatial-system.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/old-town-starter-region.md`
- `docs/map/district-boundaries.md`
- `docs/world/districts-and-routes.md`
- `docs/world/starter-town.md`

# Spatial System

Old Town's playable space is organised into 6 conceptual layers. Every tile cluster, object group, and spawn zone belongs to one of these layers. The layers determine how players move through space, what they expect to find, and how danger escalates.

## Core Rule

**Every danger must have a visible threshold before it becomes mechanically dangerous.**

A player should never take damage from a creature they could not see or predict. Ground colour shifts, broken fences, warning signs, NPC barks, lighting changes, sound cues, and gate silhouettes all serve as readable thresholds. The threshold is the teachable moment. The damage is the consequence of ignoring it.

## The 6 Spatial Layers

| Layer | Function | What Lives Here |
|-------|----------|-----------------|
| **Street** | Moves players between districts | Roads, plazas, spoke paths, market floors |
| **Edge** | Holds resources and optional danger | Field boundaries, quarry faces, riverbanks, roof edges |
| **Under** | Compresses danger and hides shortcuts | Cellars, sewers, crypts, tunnels, hidden rooms |
| **Threshold** | Marks the boundary between safe and dangerous | Gates, arches, stairs, shrine boundaries, notice boards |
| **Route** | Connects districts with purpose | Named roads, ferry paths, Oldroad trails, shortcuts |
| **Civic** | Teaches skills and anchors social play | Shops, stations, banks, shrines, ledger desks, notice boards |

## Tile Cluster Purpose Rule

Every tile cluster needs a purpose. A cluster without a purpose is visual noise. A cluster with a conflicting purpose is a design bug.

| Cluster Type | Purpose | Example |
|--------------|---------|---------|
| Roads | Move players cleanly between districts | Market Bell spoke to Foundry Row |
| Alleys | Hide shortcuts and optional danger | Sootcellar back alley to Warden Steps |
| Cellars | Compress danger into tight spaces | Sootcellar rat rooms |
| Gates | Mark thresholds between zone safety levels | Gravegate iron gate |
| Yards | Teach skills with clear station adjacency | Lath Yard bow rack and timber pile |
| Edges | Hold resources with light pressure | Patch Lane south edge where Bog Foxes roam |
| Shrines | Soften danger and offer cleanse | Shrine Hearth candle boundary near Grave Wisps |
| Quarries | Create risk/reward around better resources | North Quarry Road goblin-guarded tinstone |
| Grave spaces | Introduce status pressure and rot | Gravegate crypt mounds with Grave Mites |
| Rivers | Enable fishing, travel, and clue placement | River Stoop dock posts and ferry rope |
| Landmarks | Anchor player memory and silhouette recognition | Market Bell timber frame |

## Spatial Shorthand

A player should be able to describe creature locations with spatial shorthand that sounds like local speech:

- "Rats under Tally's" — Cellar Rat in Sootcellar
- "Goblins past the starter ore" — Mud Goblin beyond safe copper on North Quarry Road
- "Bats above Lath" — Bell Bat on Lath Yard roof edge
- "Mites below Gravegate" — Grave Mite in crypt mounds
- "Foxes behind Patch" — Bog Fox on Patch Lane south edge
- "Drake smoke near the old kiln" — Ash Drake Whelp at Foundry Row edge

This shorthand is the test for whether spatial design is working. If players cannot describe where something lives in a sentence, the placement is too abstract.

## Layer Interaction Rules

1. **Street to Edge:** Safe roads lead to edges with light pressure. The transition should be readable.
2. **Edge to Under:** Edges may hide entrances to Under spaces. The entrance is a Threshold.
3. **Threshold to Civic:** Shrines and Warden posts often sit on Thresholds to soften the crossing.
4. **Civic to Route:** Stations and shops sit on Routes so players find them naturally.
5. **Under to Street:** Cellar exits must return to Streets cleanly. No dead-end traps without quest purpose.
6. **Route to Edge:** Named roads may skirt edges. The road centre stays safe; the edge holds pressure.

---

*Last updated: 2026-05-31*

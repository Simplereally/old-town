---
doc_type: authority
canonical_path: docs/spatial/terrain-grammar.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/resource-node-placement.md`
- `docs/map/quest-object-placement.md`
- `docs/map/old-town-starter-region.md`
- `docs/world/starter-town.md`

# Terrain Grammar

Terrain grammar defines the ground types, object density rules, and visual storytelling props that make Old Town's space readable and purposeful. Every tile should communicate its function through ground type and object placement.

## Ground Types

| Ground Type | Description | Where Used |
|-------------|-------------|------------|
| **Bellstone plaza** | Smooth pale stone with tool marks | Market Bell, Counting House, civic centres |
| **Packed road** | Hard-packed dirt with cart ruts | Main spokes, Oldroad Gate approaches |
| **Soot cobble** | Darkened stone with ash residue | Sootcellar, Foundry Row edges, chimney zones |
| **Chalk flagstone** | Pale stone with chalk dust and bead fragments | Chalkhouse Court, kiln surrounds |
| **River mud** | Wet brown earth with reed stubble | River Stoop banks, ferry approaches |
| **Patch grass** | Short yellow-green grass with hide scraps | Patch Lane yards, tanning frames |
| **Quarry grit** | Grey gravel with ore dust and pickaxe scars | North Quarry Road, mining faces |
| **Grave soil** | Dark earth with bone fragments and moss | Gravegate crypt mounds, shrine boundaries |
| **Oldroad slabs** | Worn flat stones with cart track grooves | Oldroad Gate, trail beginnings |
| **Cellar floor** | Damp stone with water stains and rat droppings | Sootcellar rooms, under spaces |

## Object Density Rule

Each 8x8 gameplay chunk should contain **one** of the following:

- Landmark (silhouette object)
- Resource node cluster
- Station (skilling interactable)
- NPC or service point
- Creature spawn zone
- Quest object
- Route object (signpost, gate, bridge)
- Ledger or nook anchor
- Visual storytelling prop (ashes, skeleton, gnawed crate)

**But do not clutter movement paths.** The player must always be able to click cleanly on the ground to walk. Objects may crowd edges and back walls, but the main path through any chunk must remain clear.

## Object Placement Priorities

1. **Movement first.** Roads, alleys, and door approaches are sacred. No decorative object may block a path tile.
2. **Landmarks second.** One silhouette object per district, placed for maximum visibility from the approach road.
3. **Stations third.** Skilling stations need 2+ adjacent interactable tiles with clear approach.
4. **Resources fourth.** Node clusters sit on edges or in designated yards, never in road centres.
5. **Story props fifth.** Ashes, bones, and warning signs reinforce danger gradients without blocking movement.

## Ground Type Transitions

Ground type changes are readable danger markers. A shift from Bellstone plaza to Soot cobble tells the player they are entering a different zone before any creature appears.

| Transition | Reads As |
|------------|----------|
| Bellstone → Packed road | Leaving civic centre, entering travel space |
| Packed road → Quarry grit | Approaching mining area, possible goblin pressure |
| Packed road → Grave soil | Approaching Gravegate, danger escalation |
| Patch grass → River mud | Approaching riverbank, fishing and snapper zone |
| Soot cobble → Cellar floor | Descending into Under space, compressed danger |
| Oldroad slabs → Patch grass | Leaving trail, entering field edge, possible foxes |

## See also

- [`docs/map/resource-node-placement.md`](../map/resource-node-placement.md) — Exact node counts and areas
- [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md) — Quest object anchors
- [`docs/spatial/safe-danger-gradient.md`](safe-danger-gradient.md) — Danger gradient and readable markers

---

*Last updated: 2026-05-31*

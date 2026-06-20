# E43-S02 — Collision mask generation from objects and buildings

## Epic

E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E43-S01 (Building Object Definitions), E04-S02 (Collision Mask System), E17-S02 (Add Player Spawn and Respawn to Region Map)
- Blocks: E43-S03, E43-S04, E43-S05, E43-S06

## Spec references

- `POC_SPEC.md` §5.2 (Collision mask — `BLOCK_FULL`, directional blocks, occupancy)
- `POC_SPEC.md` §5.3 (Dynamic collision)
- `POC_SPEC.md` §24.2 (Editor data — `RegionMapDef` with objects)
- `docs/map/collision-and-route-rules.md`

## Objective

When the server loads a region, it must compose the collision map from the tile base collision plus the contribution of every placed object. Walls become full blocks, doors block only when closed, and large objects occupy multi-tile footprints. This story implements the collision composition pipeline.

## Required architectural decisions

- **Collision composition:** The final `CollisionMask` for a tile is `tile.collision | OR(sum of object footprints)` for static objects. Dynamic objects (doors, large NPCs) add or remove masks at runtime.
- **Object footprint expansion:** For each object placed at `(x, y)`, apply its footprint offsets. Add `BLOCK_FULL` (or directional blocks) to the affected tiles.
- **Large object handling:** Objects with size > 1×1 must expand collision across all occupied tiles.
- **Server-only:** Collision generation runs on the server. The client receives the collision map only as needed for presentation (e.g., debug overlay), not for gameplay decisions.
- **Validation:** Add a pathfinding test that confirms the starter region remains fully navigable after collision generation, except where intentionally blocked.

## Implementation checklist

- [X] Extend the region loader to compute collision masks after placing objects.
- [X] Implement `applyObjectCollision(region, placedObject)` that expands the footprint and ORs the mask.
- [X] Ensure doors and gates are placed with their closed collision by default.
- [X] Add a debug command to dump the collision map for a region.
- [X] Write test: a wall object blocks movement on its footprint tiles.
- [X] Write test: a 2×2 object blocks all 4 tiles.
- [X] Write test: a door object adds `BLOCK_FULL` when closed.
- [X] Write test: a path exists between all districts after static collision generation.

## Acceptance criteria

- [X] Region load composes collision from tile base and object footprints.
- [X] Walls and large objects block the correct tiles.
- [X] Doors and gates start with closed collision.
- [X] All starter-region districts remain connected after collision generation.
- [X] Collision is server-authoritative; client does not compute it.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E43/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

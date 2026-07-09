# E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E42 (Old Town Terrain and District Identity), E04 (World Map, Collision, Movement, and Pathfinding), E25 (Object Interaction and Content Routing), E14 (World Editor)
- Unlocks: E44 (Service NPCs and Economy Wiring), E45 (Core Gameplay Loop), E46 (Smoke Over Old Town Quest)

## Spec references

- `POC_SPEC.md` §5.2 (Collision mask — directional blocks, full blocks, occupancy)
- `POC_SPEC.md` §5.3 (Dynamic collision — doors, gates, large objects)
- `POC_SPEC.md` §11 (Movement and pathfinding)
- `POC_SPEC.md` §12 (Interaction model — reach, options, click resolution)
- `POC_SPEC.md` §24.1 (World editor features — collision paint, object placement, path test)
- `docs/world/districts-and-routes.md` — district layout and station placement
- `docs/map/collision-and-route-rules.md` — collision conventions
- `content/objects/` — object definitions

## Epic goal

The current starter region has objects and NPCs floating on an open field. Old Town needs streets, building walls, doorways, and blocked tiles so that movement and pathing mean something. This epic adds the world topology: buildings, walls, doors, gates, and the collision system that makes them real. The player must walk around buildings, open doors to enter shops, and navigate the hub-and-spoke district layout from Market Bell to the bank, foundry, lath yard, and shrine.

This epic also defines the building object family and the collision generation pipeline so the world editor can paint walls and doors directly, rather than hand-coding them in the generator script.

## Approach summary

1. **Building object definitions.** Create a `building` object family in `content/objects/` with variants: `wall`, `corner_wall`, `door`, `gate`, `window`, `roof`. Each variant has a footprint, default collision mask, and options (e.g., "Open", "Close" for doors).
2. **Collision generation from objects.** When the server loads a region, it composes the tile collision mask from the tile base collision plus the collision contribution of every object placed on that tile. Walls block full movement; doors block only when closed; gates block two tiles wide when closed.
3. **Door/gate interaction.** Implement the object interaction handler for doors/gates. Opening a door rotates the visual model and removes the movement block; closing restores it. Both changes are deterministic and broadcast as object update masks.
4. **Pathfinding through doors.** Update A* pathfinding to treat closed doors as blockable but interactable: the path can route through a door tile by queuing an "open" interaction before walking through.
5. **Roof and interior rendering.** Render building roofs above the player. When the player enters a building (crosses the interior threshold), hide or fade the roof for that building. This is client-side presentation only; gameplay truth is just tiles and collision.
6. **Starter-region topology pass.** Use the world editor to place walls and doors around the service buildings in Old Town (Counting House, Foundry Row, Lath Yard, Patch Lane, etc.) and regenerate the runtime map files. Add a collision validation test that ensures every building has a reachable entrance and that the districts are connected.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E43/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E43-S01` — [Building object definitions and wall/door assets](../stories/E43/E43-S01_building-object-definitions-and-wall-door-assets.md)
- [X] `E43-S02` — [Collision mask generation from objects and buildings](../stories/E43/E43-S02_collision-mask-generation-from-objects-and-buildings.md)
- [X] `E43-S03` — [Door and gate interaction with dynamic collision](../stories/E43/E43-S03_door-and-gate-interaction-with-dynamic-collision.md)
- [X] `E43-S04` — [Pathfinding through interactable doors](../stories/E43/E43-S04_pathfinding-through-interactable-doors.md)
- [X] `E43-S05` — [Roof and interior rendering](../stories/E43/E43-S05_roof-and-interior-rendering.md)
- [X] `E43-S06` — [Starter-region topology pass and collision validation](../stories/E43/E43-S06_starter-region-topology-pass-and-collision-validation.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] Buildings and walls in Old Town block movement and define real streets.
- [X] Doors and gates can be opened and closed, updating both collision and visuals.
- [X] Pathfinding routes through closed doors by opening them as part of the path.
- [X] Roofs render above the player and are hidden when inside the corresponding building.
- [X] A collision validation test confirms every service building has a reachable entrance and all districts are connected.
- [X] The world editor supports placing walls, doors, and gates and exporting collision.
- [X] Server authority over tile truth and collision is preserved; client never decides blockability.

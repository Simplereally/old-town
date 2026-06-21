# E43-S06 — Starter-region topology pass and collision validation

## Epic

E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E43-S04 (Pathfinding Through Doors), E43-S05 (Roof and Interior Rendering), E14-S05 (Pathing, LoS, and Interaction Probe Tools)
- Blocks: E44-S01

## Spec references

- `docs/world/districts-and-routes.md` — district layout and routes
- `docs/map/collision-and-route-rules.md`
- `scripts/generate-old-town-map.ts` — current placements
- `content/maps/old-town-0-0-0.json` — runtime region

## Objective

Use the world editor to add walls, doors, and roofs to the service buildings in the Old Town starter region. Then run a collision validation pass that ensures every building is reachable, every district is connected, and the world topology matches the intended hub-and-spoke layout.

## Required architectural decisions

- **Topology source of truth:** The world editor exports the final `content/maps/*.json`. The generator script is updated to consume the editor export or is retired for manual placement.
- **Building coverage:** Every service building (Counting House, Foundry Row, Lath Yard, Patch Lane, Chalkhouse Court, Warden Steps, Shrine Hearth, River Stoop, Oldroad Gate) gets walls, a door, and a roof.
- **Route validation:** A path must exist from Market Bell to each district and between adjacent districts. The validation test uses the A* pathfinder on the composed collision map.
- **Door placement:** Every building has at least one door that faces a public route. No building should be sealed.
- **No gameplay traps:** The validation must detect accidental collision traps (e.g., a player spawning inside a fully blocked area) and fail the build.

## Implementation checklist

- [X] Add walls, doors, and roofs to all service buildings in the world editor.
- [X] Export the updated `content/maps/old-town-0-0-0.json`.
- [X] Update `scripts/generate-old-town-map.ts` to include building placements or mark it as deprecated for this region.
- [X] Run `bun run content:validate` and fix any errors.
- [X] Add a topology validation test that paths from Market Bell to every district.
- [X] Add a test that every building has a reachable door tile.
- [X] Add a test that the player spawn and respawn points are not inside collision.
- [X] Visually inspect the starter region in `bun run dev`.

## Acceptance criteria

- [X] All service buildings have walls, doors, and roofs.
- [X] A path exists from Market Bell to every district and service building.
- [X] Every building has a reachable door.
- [X] Spawn and respawn points are valid and not blocked.
- [X] Collision validation tests pass.
- [X] The epic and all stories are moved to completed.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — manual topology walkthrough

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E43/` only after all criteria pass.
- [X] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.

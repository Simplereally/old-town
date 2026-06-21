# E43-S05 — Roof and interior rendering

## Epic

E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E43-S01 (Building Object Definitions), E42-S02 (Render Terrain Chunks), E33-S03 (Static Object Instancing)
- Blocks: E43-S06

## Spec references

- `POC_SPEC.md` §7.2 (Three.js world layers — StaticObjectLayer, OverlayLayer)
- `POC_SPEC.md` §7.3 (Renderer rules — outlines/selection rings, cheap shadows)
- `POC_SPEC.md` §23.2 (Art constraints — low-poly, common object < 500 triangles)

## Objective

Render building roofs above the player and hide them when the player enters the corresponding building. This makes interiors usable and gives the world a classic isometric MMO feel. Roof state is client-side presentation only; the server does not track it.

## Required architectural decisions

- **Roof object:** Roofs are separate building objects placed in the world editor. They reference the building footprint they cover.
- **Interior detection:** The client determines the player is "inside" a building when the player's true tile is within the building footprint. This is computed locally from the region data.
- **Roof visibility:** When inside, hide or fade the roof mesh. When outside, show it. The transition is immediate for POC; fade can be added later.
- **No gameplay impact:** Roof visibility does not affect collision, target selection, or line of sight. It is purely visual.
- **Multi-roof handling:** A large building may have multiple roof sections. Each section toggles independently based on the player's tile.

## Implementation checklist

- [X] Add roof object definitions (`building_roof_flat`, `building_roof_gable`, etc.) in `content/objects/buildings.json`.
- [X] Extend the object renderer to track roof sections and their covered footprints.
- [X] Implement interior detection in the client based on player true tile.
- [X] Toggle roof visibility when the player enters/leaves the footprint.
- [X] Ensure roof geometry does not cast shadows on the player when hidden (or use a simple shadow cull).
- [X] Write test: a roof is visible when the player is outside the footprint.
- [X] Write test: the same roof is hidden when the player is inside the footprint.
- [X] Write test: multiple roof sections toggle independently.

## Acceptance criteria

- [X] Building roofs render above the player when outside.
- [X] Roofs hide when the player is inside the building footprint.
- [X] Roof visibility is client-side only and does not affect gameplay truth.
- [X] The transition is readable and does not cause flicker.
- [X] Visual style remains lo-fi.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — walk in and out of buildings and verify roofs hide/show

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E43/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

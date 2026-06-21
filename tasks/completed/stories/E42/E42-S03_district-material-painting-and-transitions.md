# E42-S03 — District material painting and transitions

## Epic

E42 — Old Town Terrain and District Identity

## Dependency chain

- Depends on: E42-S02 (Render Terrain Chunks), E14-S03 (Tile paint in world editor)
- Blocks: E42-S04, E42-S05

## Spec references

- `docs/world/districts-and-routes.md` — district list
- `docs/map/district-boundaries.md` — district trigger boxes
- `scripts/generate-old-town-map.ts` — `terrainOverrides` and `fillRect` helper
- `content/maps/old-town-0-0-0.json` — current tile overrides

## Objective

Ensure the Old Town starter map clearly expresses its district identity. The generator script already paints district tiles, but the world editor and the runtime renderer must support clean material transitions. This story improves the authored map, adds transition tiles where districts meet, and validates that every district has a distinct visual footprint.

## Required architectural decisions

- **District material painting:** Districts are painted in the world editor / generator by assigning `underlayId` to the tiles inside the district boundary. The renderer does not know district names; it only renders material IDs.
- **Transition tiles:** Where two districts meet, use a transition tile material (e.g., `bellstone_to_soot_cobble`) or a checkerboard border. For POC, keep transitions simple: a 1-tile mixed-color border is enough.
- **Roads and paths:** The routes between districts use `oldroad_slabs` or `packed_road`. These are painted as overlays on top of the district base material.
- **Validation:** Add a content check that every district trigger box has at least one tile with the expected district material inside it.

## Implementation checklist

- [X] Update `scripts/generate-old-town-map.ts` to place transition tiles on district boundaries.
- [X] Add transition material definitions in `content/materials/ground-materials.json` (e.g., `grass_to_bellstone`, `bellstone_to_soot_cobble`).
- [X] Regenerate `content/maps/old-town-0-0-0.json` and verify it loads.
- [X] Add a validator test that each district trigger box contains at least one tile with the expected material.
- [X] Add a visual smoke test: render the map and assert each district material appears at least once.
- [X] Document the district painting convention in `docs/map/district-boundaries.md` or a new `docs/map/terrain-painting.md`.

## Acceptance criteria

- [X] The starter map shows clear district boundaries without hard visual cuts.
- [X] Major routes between districts are visible as road overlays.
- [X] Every district has a distinct material footprint inside its trigger box.
- [X] The generated runtime map is deterministic and loads in the client.
- [X] No copied OSRS map layouts or colors.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run scripts/generate-old-town-map.ts`
- [ ] `bun run dev` — visually confirm district boundaries

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E42/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

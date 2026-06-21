# E42-S05 — Terrain validation and starter-region visual pass

## Epic

E42 — Old Town Terrain and District Identity

## Dependency chain

- Depends on: E42-S03 (District Material Painting), E42-S04 (Water, Bridges, and Elevation)
- Blocks: E43-S01

## Spec references

- `POC_SPEC.md` §7.1 (Visual style)
- `POC_SPEC.md` §7.3 (Renderer rules — performance budgets)
- `POC_SPEC.md` §24.2 (Editor data — `RegionMapDef`)
- `docs/world/districts-and-routes.md`

## Objective

Run a final validation and visual pass on the Old Town terrain. Ensure all district materials are rendered, performance budgets are met, the world editor exports a clean runtime map, and a manual visual inspection confirms the town looks like a town.

## Required architectural decisions

- **Visual pass checklist:** Each district must be visually distinct from its neighbors; roads must connect districts; water/bridges must be readable; no z-fighting or light leaks.
- **Performance budget:** Max 1 draw call per material per chunk for terrain. Water is one additional plane per chunk. Total terrain draw calls should be < 50 for the active scene.
- **Runtime map validation:** The exported `content/maps/*.json` must pass `bun run content:validate` and load in the client without errors.
- **Screenshot test:** Add a Playwright or Vitest visual test that renders the Market Bell and asserts the pixel under the player is not the default green.

## Implementation checklist

- [X] Run `bun run dev` and visually inspect each district in the starter region.
- [X] Fix any z-fighting between terrain and overlay.
- [X] Fix any missing material references.
- [X] Add a visual regression test for the Market Bell spawn view.
- [X] Add a performance test that asserts the terrain draw-call count is within budget.
- [X] Add a validator test that the runtime map JSON is loadable by the client.
- [X] Update `tasks/epics/E42_old-town-terrain-and-district-identity.md` checklist.
- [X] Move completed E42 stories to `tasks/completed/stories/E42/`.

## Acceptance criteria

- [X] The starter region renders with distinct district materials, roads, and water/bridge features.
- [X] No default green plane is visible in the Market Bell spawn view.
- [X] Terrain draw calls stay within the performance budget.
- [X] All validation commands pass.
- [X] The epic checklist is fully marked and the epic is moved to completed.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [ ] `bun run dev` — manual visual pass

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E42/` only after all criteria pass.
- [X] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.

# E43-S01 — Building object definitions and wall/door assets

## Epic

E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E42-S05 (Terrain Validation), E14-S04 (Object, NPC, resource node, and trigger placement), E02-S05 (Seed NPCs, objects, resource nodes, and drops)
- Blocks: E43-S02, E43-S03, E43-S04, E43-S05, E43-S06

## Spec references

- `POC_SPEC.md` §5.2 (Collision mask)
- `POC_SPEC.md` §12 (Interaction model)
- `POC_SPEC.md` §23.1 (Asset formats — models `.glb`)
- `POC_SPEC.md` §23.2 (Art constraints — common object < 500 triangles)
- `content/objects/` — object definitions

## Objective

Create the building object family and the wall/door/gate asset definitions needed to turn the open starter region into a town with streets and buildings. This story is content and schema work; the runtime collision integration happens in E43-S02.

## Required architectural decisions

- **Building family IDs:** Use a consistent namespace:
  - `building_wall_straight`, `building_wall_corner`, `building_wall_t_window`
  - `building_door_wood`, `building_door_iron`, `building_gate_town`
  - `building_roof_flat`, `building_roof_gable`, `building_roof_tower`
- **Object schema extension:** Object definitions need `footprint` (set of occupied tile offsets), `defaultCollision` (bitmask), and `interactionOptions` (e.g., "Open" / "Close" for doors).
- **Asset style:** Low-poly chunky buildings with hand-painted or flat colors. No photoreal textures. Each district can reuse the same wall/door assets with a district tint via the material registry.
- **Originality:** Building silhouettes and proportions must be original; no OSRS building models or exact layouts.
- **Content files:** Add new definitions to `content/objects/buildings.json` and `content/objects/doors.json`.

## Implementation checklist

- [X] Extend the object schema in `packages/shared/src/content-schemas/object.ts` with `footprint` and `defaultCollision`.
- [X] Create `content/objects/buildings.json` with wall, roof, and window variants.
- [X] Create `content/objects/doors.json` with wooden door and town gate variants.
- [X] Define interaction options for doors/gates: "Open", "Close".
- [X] Add placeholder low-poly GLB models or procedural geometry specs for walls and doors.
- [X] Write test: every building object has a valid footprint and collision mask.
- [X] Write test: door objects have "Open" and "Close" options.
- [X] Write test: no object ID conflicts with existing objects.

## Acceptance criteria

- [X] Building object definitions exist and validate.
- [X] Door and gate objects have open/close interaction options.
- [X] Footprints and collision masks are defined for every building object.
- [X] Content validation passes for the new object files.
- [X] All assets are original; no OSRS models or names.

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

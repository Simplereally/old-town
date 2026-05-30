# E06-S02 — Implement camera and tile projection

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E06-S01
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Create fixed/semi-fixed isometric camera and helpers for world-tile to render-space conversion.

## Implementation checklist

- [ ] Implement orthographic camera with OSRS-like readable angle.
- [ ] Define tile-to-world conversion using TILE_SIZE_WORLD_UNITS.
- [ ] Implement screen-to-ray and ray-to-ground-plane helpers.
- [ ] Add camera pan/zoom constraints for debug/dev.
- [ ] Add visual grid toggle.

## Acceptance criteria

- [ ] Tile centers align visually with server TileCoord positions.
- [ ] Camera exposes enough data for picking in later epic.
- [ ] No gameplay system reads camera state as truth.

## Validation commands

- [ ] `bun run typecheck`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

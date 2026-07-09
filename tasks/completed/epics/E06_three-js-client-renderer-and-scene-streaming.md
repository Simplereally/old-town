# E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E05
- Unlocks: E07

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Epic goal

Render the authoritative tile world in Three.js with pooled layers, chunk streaming, interpolated actors, simple original placeholder assets, camera controls, and no gameplay truth in renderer state.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E06/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E06-S01` — [Create Vite Three.js client shell](../stories/E06/E06-S01_create-vite-three-js-client-shell.md)
- [X] `E06-S02` — [Implement camera and tile projection](../stories/E06/E06-S02_implement-camera-and-tile-projection.md)
- [X] `E06-S03` — [Render terrain chunks from region load packets](../stories/E06/E06-S03_render-terrain-chunks-from-region-load-packets.md)
- [X] `E06-S04` — [Render static and dynamic objects](../stories/E06/E06-S04_render-static-and-dynamic-objects.md)
- [X] `E06-S05` — [Render actors with interpolation](../stories/E06/E06-S05_render-actors-with-interpolation.md)
- [X] `E06-S06` — [Render projectiles, hitsplats, ground items, and overlays](../stories/E06/E06-S06_render-projectiles-hitsplats-ground-items-and-overlays.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

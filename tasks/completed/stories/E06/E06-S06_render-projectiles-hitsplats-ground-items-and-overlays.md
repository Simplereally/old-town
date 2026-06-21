# E06-S06 — Render projectiles, hitsplats, ground items, and overlays

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E06-S05
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Add the visual feedback primitives needed by combat, drops, chat, and debugging.

## Implementation checklist

- [X] Create ProjectileLayer with start/end tile interpolation.
- [X] Create Hitsplat overlay anchored to actors.
- [X] Create GroundItemLayer with sprite or tiny mesh items.
- [X] Create overhead text rendering for chat.
- [X] Create DebugLayer for true tile, paths, collision, LoS, and footprints when data is available.

## Acceptance criteria

- [X] Visual effects are driven by packets/deltas only.
- [X] Ground item and hitsplat visuals can be added/removed without scene leaks.
- [X] Debug overlays can be toggled.

## Validation commands

- [X] `bun run client:dev`
- [X] `bun run typecheck`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

# E06-S05 — Render actors with interpolation

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E06-S04
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Render local player, remote players, and NPCs with server-tick interpolation and visual-only animation states.

## Implementation checklist

- [X] Create ActorRenderer and actor entity view model.
- [X] Maintain previous and current server tile states.
- [X] Interpolate visual position over the 600ms render window.
- [X] Render facing direction and idle/walk/run/attack/cast/hit/die placeholder animations.
- [X] Render local player distinct debug marker.

## Acceptance criteria

- [X] True tile updates only from server deltas.
- [X] Visual interpolation hides tick snaps.
- [X] Remote player movement displays from another browser tab.

## Validation commands

- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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

- [ ] Create ActorRenderer and actor entity view model.
- [ ] Maintain previous and current server tile states.
- [ ] Interpolate visual position over the 600ms render window.
- [ ] Render facing direction and idle/walk/run/attack/cast/hit/die placeholder animations.
- [ ] Render local player distinct debug marker.

## Acceptance criteria

- [ ] True tile updates only from server deltas.
- [ ] Visual interpolation hides tick snaps.
- [ ] Remote player movement displays from another browser tab.

## Validation commands

- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

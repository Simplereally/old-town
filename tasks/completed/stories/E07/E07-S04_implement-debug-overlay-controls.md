# E07-S04 — Implement debug overlay controls

## Epic

E07 — Client Input, Picking, UI Shell, and Debug Tooling

## Dependency chain

- Depends on: E07-S03
- Blocks: next story in `E07` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §7
- POC_SPEC.md §8
- POC_SPEC.md §11
- POC_SPEC.md §12
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Expose development overlays needed to verify movement, collision, pathing, LoS, action queues, combat timers, and deltas.

## Implementation checklist

- [X] Create keyboard/debug panel toggles.
- [X] Display current tick, local true tile, visual position, region/chunk, and ping.
- [X] Display current path, destination, collision flags, LoS ray, NPC footprint, and interaction reach tiles.
- [X] Display action queue and combat cooldown readouts when provided by server debug packets.
- [X] Ensure debug overlays are removable for production builds.

## Acceptance criteria

- [X] Every invisible primitive in POC_SPEC.md §28.1 can be inspected during dev.
- [X] Debug overlays do not mutate gameplay state.

## Validation commands

- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

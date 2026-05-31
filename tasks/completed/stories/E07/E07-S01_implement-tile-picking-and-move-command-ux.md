# E07-S01 — Implement tile picking and move command UX

## Epic

E07 — Client Input, Picking, UI Shell, and Debug Tooling

## Dependency chain

- Depends on: E06-S06
- Blocks: next story in `E07` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §7
- POC_SPEC.md §8
- POC_SPEC.md §11
- POC_SPEC.md §12
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Allow the player to click the world and send server-authoritative MoveIntent commands.

## Implementation checklist

- [X] Implement raycast from mouse to ground/tile.
- [X] Show immediate visual click marker.
- [X] Send MoveIntent with destination tile through GameSocket.
- [X] Display queued path from server delta/debug data when available.
- [X] Handle rejected movement command visibly in debug log.

## Acceptance criteria

- [X] Clicking a reachable tile causes server-authoritative movement.
- [X] Click marker appears immediately but true movement follows server delta.
- [X] Client cannot move without server response.

## Validation commands

- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

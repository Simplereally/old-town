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

- [ ] Implement raycast from mouse to ground/tile.
- [ ] Show immediate visual click marker.
- [ ] Send MoveIntent with destination tile through GameSocket.
- [ ] Display queued path from server delta/debug data when available.
- [ ] Handle rejected movement command visibly in debug log.

## Acceptance criteria

- [ ] Clicking a reachable tile causes server-authoritative movement.
- [ ] Click marker appears immediately but true movement follows server delta.
- [ ] Client cannot move without server response.

## Validation commands

- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

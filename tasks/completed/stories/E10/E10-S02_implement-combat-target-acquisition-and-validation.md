# E10-S02 — Implement combat target acquisition and validation

## Epic

E10 — NPC AI, Combat, Death, Drops, and Respawn

## Dependency chain

- Depends on: E10-S01
- Blocks: next story in `E10` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §14
- POC_SPEC.md §21
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Allow player-vs-NPC melee targeting through interaction commands and NPC auto-retaliation hooks.

## Implementation checklist

- [X] Route Attack NPC option to combat target assignment.
- [X] Validate target exists, is alive, and is attackable.
- [X] Use reach resolution/pathing if not adjacent.
- [X] Face target when in range.
- [X] Implement auto-retaliate target assignment on received hit.
- [X] Clear invalid/dead/out-of-leash targets.

## Acceptance criteria

- [X] Player can click goblin/rat to start combat.
- [X] Out-of-range targets cause movement before attacks.
- [X] Combat target cannot be spoofed by client.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

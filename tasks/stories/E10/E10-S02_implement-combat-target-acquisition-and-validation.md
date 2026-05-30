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

- [ ] Route Attack NPC option to combat target assignment.
- [ ] Validate target exists, is alive, and is attackable.
- [ ] Use reach resolution/pathing if not adjacent.
- [ ] Face target when in range.
- [ ] Implement auto-retaliate target assignment on received hit.
- [ ] Clear invalid/dead/out-of-leash targets.

## Acceptance criteria

- [ ] Player can click goblin/rat to start combat.
- [ ] Out-of-range targets cause movement before attacks.
- [ ] Combat target cannot be spoofed by client.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

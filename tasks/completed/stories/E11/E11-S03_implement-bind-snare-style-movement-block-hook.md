# E11-S03 — Implement bind/snare-style movement block hook

## Epic

E11 — Magic, Projectiles, Line of Sight, and Teleports

## Dependency chain

- Depends on: E11-S02
- Blocks: next story in `E11` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §5
- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §17
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Add a reusable spell effect that can block movement for a tick duration.

## Implementation checklist

- [X] Create MovementBlockComponent or status modifier.
- [X] Prevent path advancement while blocked.
- [X] Clear or pause path according to documented behavior.
- [X] Emit overhead/status/debug feedback.
- [X] Add one starter bind spell content entry if not present.
- [X] Add tests for block duration and movement command during block.

## Acceptance criteria

- [X] Movement block uses tick expiry.
- [X] Blocked movement does not desync client visual truth.
- [X] Status can be reused by future spells/NPC effects.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

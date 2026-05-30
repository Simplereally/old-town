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

- [ ] Create MovementBlockComponent or status modifier.
- [ ] Prevent path advancement while blocked.
- [ ] Clear or pause path according to documented behavior.
- [ ] Emit overhead/status/debug feedback.
- [ ] Add one starter bind spell content entry if not present.
- [ ] Add tests for block duration and movement command during block.

## Acceptance criteria

- [ ] Movement block uses tick expiry.
- [ ] Blocked movement does not desync client visual truth.
- [ ] Status can be reused by future spells/NPC effects.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E13-S02 — Persist character core state

## Epic

E13 — Persistence, Character Save/Load, and Item Audit

## Dependency chain

- Depends on: E13-S01
- Blocks: next story in `E13` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §20
- POC_SPEC.md §21
- POC_SPEC.md §25
- POC_SPEC.md §27

## Objective

Save and load position, HP, skills, inventory, equipment, quest vars, unlock vars, and quest points.

## Implementation checklist

- [ ] Map ECS components to CharacterSnapshot.
- [ ] Load character snapshot during session bootstrap when available.
- [ ] Save on disconnect and configured dirty events.
- [ ] Reject invalid/stale snapshots safely.
- [ ] Add tests for every persisted component.

## Acceptance criteria

- [ ] Refreshing/reconnecting preserves progress in dev mode.
- [ ] Invalid save data fails visibly and does not corrupt live state.
- [ ] No client-provided snapshot is trusted.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run server:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

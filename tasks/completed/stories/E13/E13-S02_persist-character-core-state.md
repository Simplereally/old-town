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

- [X] Map ECS components to CharacterSnapshot.
- [X] Load character snapshot during session bootstrap when available.
- [X] Save on disconnect and configured dirty events.
- [X] Reject invalid/stale snapshots safely.
- [X] Add tests for every persisted component.

## Acceptance criteria

- [X] Refreshing/reconnecting preserves progress in dev mode.
- [X] Invalid save data fails visibly and does not corrupt live state.
- [X] No client-provided snapshot is trusted.

## Validation commands

- [X] `bun run test`
- [X] `bun run server:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

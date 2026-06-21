# E13-S03 — Implement dirty-state persistence triggers

## Epic

E13 — Persistence, Character Save/Load, and Item Audit

## Dependency chain

- Depends on: E13-S02
- Blocks: next story in `E13` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §20
- POC_SPEC.md §21
- POC_SPEC.md §25
- POC_SPEC.md §27

## Objective

Persist immediately for high-value mutations and lazily for low-value transient state.

## Implementation checklist

- [X] Mark inventory, equipment, quest completion, level-up, death, and bank-ready mutations as immediate-save events.
- [X] Mark position/HP/transient state as periodic dirty saves.
- [X] Create save queue that coalesces repeated dirty events.
- [X] Flush save queue on shutdown.
- [X] Add tests for coalescing and immediate-save triggers.

## Acceptance criteria

- [X] Item/quest/level mutations are not lost on normal shutdown.
- [X] Position saves do not execute every tick unnecessarily.
- [X] Save queue is observable in debug logs.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

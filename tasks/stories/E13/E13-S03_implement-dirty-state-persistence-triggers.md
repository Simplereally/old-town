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

- [ ] Mark inventory, equipment, quest completion, level-up, death, and bank-ready mutations as immediate-save events.
- [ ] Mark position/HP/transient state as periodic dirty saves.
- [ ] Create save queue that coalesces repeated dirty events.
- [ ] Flush save queue on shutdown.
- [ ] Add tests for coalescing and immediate-save triggers.

## Acceptance criteria

- [ ] Item/quest/level mutations are not lost on normal shutdown.
- [ ] Position saves do not execute every tick unnecessarily.
- [ ] Save queue is observable in debug logs.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

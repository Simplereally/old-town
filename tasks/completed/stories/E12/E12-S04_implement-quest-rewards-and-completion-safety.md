# E12-S04 — Implement quest rewards and completion safety

## Epic

E12 — Dialogue, Quest Vars, Quest Engine, and POC Quest

## Dependency chain

- Depends on: E12-S03
- Blocks: next story in `E12` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §18
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Make quest completion transactional and non-repeatable.

## Implementation checklist

- [X] Implement reward effects for items, coins, XP, quest points, unlock vars.
- [X] Prevent duplicate completion rewards.
- [X] Handle inventory-full reward failures with documented behavior.
- [X] Record completion tick.
- [X] Emit messages, XP drops, inventory/skill/var deltas.
- [X] Add tests for duplicate turn-in and partial failure prevention.

## Acceptance criteria

- [X] Quest completion cannot double-reward.
- [X] Rewards mutate state through InventorySystem/SkillSystem/VarSystem only.
- [X] Quest point total updates.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

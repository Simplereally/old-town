# E07-S05 — Implement UI command routing and feedback messages

## Epic

E07 — Client Input, Picking, UI Shell, and Debug Tooling

## Dependency chain

- Depends on: E07-S04
- Blocks: next story in `E07` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §7
- POC_SPEC.md §8
- POC_SPEC.md §11
- POC_SPEC.md §12
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Route item, spell, dialogue, and interface commands from UI to server intents with clear feedback.

## Implementation checklist

- [X] Implement item click/drop/equip/eat/use command routes.
- [X] Implement spell selection and target selection mode.
- [X] Implement dialogue option selection route.
- [X] Render server messages and command rejection reasons.
- [X] Add local disabled states based on known authoritative state without trusting them for validation.

## Acceptance criteria

- [X] Every UI action sends an intent, not a mutation.
- [X] Server rejection is visible to user/dev.
- [X] Spell/item target modes can be cancelled.

## Validation commands

- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

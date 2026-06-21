# E12-S02 — Implement dialogue graph engine

## Epic

E12 — Dialogue, Quest Vars, Quest Engine, and POC Quest

## Dependency chain

- Depends on: E12-S01
- Blocks: next story in `E12` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §18
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Open NPC dialogue, show player options, validate requirements, apply effects, and advance nodes.

## Implementation checklist

- [X] Route Talk-to NPC option to DialogueDef.
- [X] Evaluate node requirements and option requirements.
- [X] Send InterfaceOpen/dialogue packet to client.
- [X] Process dialogue option UI intents.
- [X] Apply allowed effects such as SetVar, AddItem, RemoveItem, StartQuest, CompleteQuest, SendMessage.
- [X] Add tests for hidden options, effects, invalid option index, and dialogue close.

## Acceptance criteria

- [X] Dialogue content controls text/options/effects.
- [X] Client cannot select unavailable options successfully.
- [X] Dialogue can start quest vars.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

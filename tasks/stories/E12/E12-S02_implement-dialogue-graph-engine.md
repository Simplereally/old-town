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

- [ ] Route Talk-to NPC option to DialogueDef.
- [ ] Evaluate node requirements and option requirements.
- [ ] Send InterfaceOpen/dialogue packet to client.
- [ ] Process dialogue option UI intents.
- [ ] Apply allowed effects such as SetVar, AddItem, RemoveItem, StartQuest, CompleteQuest, SendMessage.
- [ ] Add tests for hidden options, effects, invalid option index, and dialogue close.

## Acceptance criteria

- [ ] Dialogue content controls text/options/effects.
- [ ] Client cannot select unavailable options successfully.
- [ ] Dialogue can start quest vars.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

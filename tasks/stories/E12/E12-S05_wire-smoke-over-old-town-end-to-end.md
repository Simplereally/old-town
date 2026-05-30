# E12-S05 — Wire Smoke Over Old Town end-to-end

## Epic

E12 — Dialogue, Quest Vars, Quest Engine, and POC Quest

## Dependency chain

- Depends on: E12-S04
- Blocks: next story in `E12` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §18
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Make the seed quest playable from first dialogue through final reward.

## Implementation checklist

- [ ] Connect baker dialogue to quest start/progression.
- [ ] Track required logs, cellar rat kills, and oven interaction.
- [ ] Require or consume items exactly as content defines.
- [ ] Reward bread/coins/cooking XP/quest point/unlock var.
- [ ] Verify quest journal text at every stage.
- [ ] Add integration test walking through quest state transitions with simulated events.

## Acceptance criteria

- [ ] The POC quest can be completed in-game.
- [ ] Every quest state transition is visible in journal/UI.
- [ ] No bespoke code path is named only for this quest except seed test wiring.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

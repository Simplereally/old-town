# E09-S04 — Implement mining loop

## Epic

E09 — Skilling and Resource Node Loops

## Dependency chain

- Depends on: E09-S03
- Blocks: next story in `E09` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §15
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Make rock mining produce ore, XP, depletion, and respawn through the same generic gathering engine.

## Implementation checklist

- [X] Route Mine object option to gathering action.
- [X] Use pickaxe/tool tags and mining skill.
- [X] Award ore and mining XP.
- [X] Handle depletion/respawn and object transform.
- [X] Share common code with woodcutting where correct.
- [X] Add tests proving woodcutting/mining definitions can differ without new code.

## Acceptance criteria

- [X] Mining does not duplicate woodcutting-specific constants.
- [X] Ore and mining XP are awarded authoritatively.
- [X] Rock state updates client visuals.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

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

- [ ] Route Mine object option to gathering action.
- [ ] Use pickaxe/tool tags and mining skill.
- [ ] Award ore and mining XP.
- [ ] Handle depletion/respawn and object transform.
- [ ] Share common code with woodcutting where correct.
- [ ] Add tests proving woodcutting/mining definitions can differ without new code.

## Acceptance criteria

- [ ] Mining does not duplicate woodcutting-specific constants.
- [ ] Ore and mining XP are awarded authoritatively.
- [ ] Rock state updates client visuals.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

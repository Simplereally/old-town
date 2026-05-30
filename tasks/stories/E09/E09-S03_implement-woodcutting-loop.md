# E09-S03 — Implement woodcutting loop

## Epic

E09 — Skilling and Resource Node Loops

## Dependency chain

- Depends on: E09-S02
- Blocks: next story in `E09` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §15
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Make tree chopping produce logs, XP, depletion, and respawn through the action queue.

## Implementation checklist

- [ ] Route Chop object option to gathering action.
- [ ] Roll success chance using skill level, tool power, and node difficulty.
- [ ] On success add log and XP.
- [ ] Roll depletion and transform tree when depleted.
- [ ] Repeat at node actionTicks while valid.
- [ ] Emit animations/messages/XP drops.

## Acceptance criteria

- [ ] Clicking tree walks to it, faces it, and chops repeatedly.
- [ ] Logs and woodcutting XP are awarded authoritatively.
- [ ] Tree eventually depletes and respawns.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

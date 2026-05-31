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

- [X] Route Chop object option to gathering action.
- [X] Roll success chance using skill level, tool power, and node difficulty.
- [X] On success add log and XP.
- [X] Roll depletion and transform tree when depleted.
- [X] Repeat at node actionTicks while valid.
- [X] Emit animations/messages/XP drops.

## Acceptance criteria

- [X] Clicking tree walks to it, faces it, and chops repeatedly.
- [X] Logs and woodcutting XP are awarded authoritatively.
- [X] Tree eventually depletes and respawns.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

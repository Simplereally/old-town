# E12-S03 — Implement quest requirement/objective/trigger engine

## Epic

E12 — Dialogue, Quest Vars, Quest Engine, and POC Quest

## Dependency chain

- Depends on: E12-S02
- Blocks: next story in `E12` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §18
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Evaluate quest requirements, objectives, and triggers from content definitions during gameplay events.

## Implementation checklist

- [X] Implement requirement evaluator for level, item, var, quest stage, kill count.
- [X] Implement trigger dispatcher for dialogue, item gained/removed, NPC killed, object interacted, skill XP gained, area entered.
- [X] Implement objective completion checks.
- [X] Emit quest journal updates.
- [X] Add tests for each trigger class.

## Acceptance criteria

- [X] Quest progression is triggered by engine events, not hardcoded quest functions.
- [X] Quest cannot complete before requirements/objectives are satisfied.
- [X] Quest journal reflects authoritative stage.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

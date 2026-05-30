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

- [ ] Implement requirement evaluator for level, item, var, quest stage, kill count.
- [ ] Implement trigger dispatcher for dialogue, item gained/removed, NPC killed, object interacted, skill XP gained, area entered.
- [ ] Implement objective completion checks.
- [ ] Emit quest journal updates.
- [ ] Add tests for each trigger class.

## Acceptance criteria

- [ ] Quest progression is triggered by engine events, not hardcoded quest functions.
- [ ] Quest cannot complete before requirements/objectives are satisfied.
- [ ] Quest journal reflects authoritative stage.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

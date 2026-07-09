# E12 — Dialogue, Quest Vars, Quest Engine, and POC Quest

## Dependency chain

- Depends on: E11
- Unlocks: E13

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §18
- POC_SPEC.md §22
- POC_SPEC.md §27

## Epic goal

Implement the content-defined quest system using dialogue graphs, player variables, objectives, triggers, rewards, and one end-to-end playable quest: Smoke Over Old Town.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E12/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E12-S01` — [Implement player var and quest var storage](../stories/E12/E12-S01_implement-player-var-and-quest-var-storage.md)
- [X] `E12-S02` — [Implement dialogue graph engine](../stories/E12/E12-S02_implement-dialogue-graph-engine.md)
- [X] `E12-S03` — [Implement quest requirement/objective/trigger engine](../stories/E12/E12-S03_implement-quest-requirement-objective-trigger-engine.md)
- [X] `E12-S04` — [Implement quest rewards and completion safety](../stories/E12/E12-S04_implement-quest-rewards-and-completion-safety.md)
- [X] `E12-S05` — [Wire Smoke Over Old Town end-to-end](../stories/E12/E12-S05_wire-smoke-over-old-town-end-to-end.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

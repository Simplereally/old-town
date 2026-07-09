# E09 — Skilling and Resource Node Loops

## Dependency chain

- Depends on: E08
- Unlocks: E10

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §15
- POC_SPEC.md §27
- POC_SPEC.md §28

## Epic goal

Implement repeatable tick-based gathering/processing loops for woodcutting, mining, and cooking using content-defined nodes, tools, action queues, success rolls, depletion, respawn, inventory, and XP.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E09/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E09-S01` — [Implement resource node runtime state](../stories/E09/E09-S01_implement-resource-node-runtime-state.md)
- [X] `E09-S02` — [Implement gathering action validator](../stories/E09/E09-S02_implement-gathering-action-validator.md)
- [X] `E09-S03` — [Implement woodcutting loop](../stories/E09/E09-S03_implement-woodcutting-loop.md)
- [X] `E09-S04` — [Implement mining loop](../stories/E09/E09-S04_implement-mining-loop.md)
- [X] `E09-S05` — [Implement cooking processing loop](../stories/E09/E09-S05_implement-cooking-processing-loop.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

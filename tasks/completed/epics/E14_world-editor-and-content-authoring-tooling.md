# E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E13
- Unlocks: E15

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Epic goal

Create the tooling loop that prevents hand-coded maps and enables rapid content iteration: validator CLI, visual map editor, tile/collision/object/NPC/resource/trigger authoring, export, and debug probes.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E14/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E14-S01` — [Upgrade content validator CLI for authoring](../completed/stories/E14/E14-S01_upgrade-content-validator-cli-for-authoring.md)
- [X] `E14-S02` — [Create world editor shell](../completed/stories/E14/E14-S02_create-world-editor-shell.md)
- [X] `E14-S03` — [Implement tile paint and height/collision editing](../completed/stories/E14/E14-S03_implement-tile-paint-and-height-collision-editing.md)
- [X] `E14-S04` — [Implement object, NPC, resource node, and trigger placement](../completed/stories/E14/E14-S04_implement-object-npc-resource-node-and-trigger-placement.md)
- [X] `E14-S05` — [Implement pathing, LoS, and interaction probe tools](../completed/stories/E14/E14-S05_implement-pathing-los-and-interaction-probe-tools.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

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

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E14/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E14-S01` — [Upgrade content validator CLI for authoring](../stories/E14/E14-S01_upgrade-content-validator-cli-for-authoring.md)
- [ ] `E14-S02` — [Create world editor shell](../stories/E14/E14-S02_create-world-editor-shell.md)
- [ ] `E14-S03` — [Implement tile paint and height/collision editing](../stories/E14/E14-S03_implement-tile-paint-and-height-collision-editing.md)
- [ ] `E14-S04` — [Implement object, NPC, resource node, and trigger placement](../stories/E14/E14-S04_implement-object-npc-resource-node-and-trigger-placement.md)
- [ ] `E14-S05` — [Implement pathing, LoS, and interaction probe tools](../stories/E14/E14-S05_implement-pathing-los-and-interaction-probe-tools.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

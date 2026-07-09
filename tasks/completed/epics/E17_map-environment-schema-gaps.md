# E17 — Map Environment Schema Gaps

## Dependency chain

- Depends on: E15
- Unlocks: none

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- docs/content/map-regions.md

## Epic goal

Extend the region map schema to include resource node placement, player spawn points, and death respawn points. This epic closes the gap where the map schema defines tiles and collision but lacks authored placement data for runtime entities and player spawn mechanics.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E17/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E17-S01` — [Add Resource Node Placement to Region Map](../stories/E17/E17-S01_add-resource-node-placement-to-region-map.md)
- [X] `E17-S02` — [Add Player Spawn and Respawn to Region Map](../stories/E17/E17-S02_add-player-spawn-and-respawn-to-region-map.md)
- [X] `E17-S03` — [Validate Map Environment Content](../stories/E17/E17-S03_validate-map-environment-content.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

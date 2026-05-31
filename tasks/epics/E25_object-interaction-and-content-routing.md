# E25 — Object Interaction and Content Routing

## Dependency chain

- Depends on: E09, E21
- Unlocks: E26

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 3, P1 gaps 8, 11, 13, 15)
- docs/content/action-wiring-audit.md (action IDs: `pray`, `read`, `inspect`, `fish`, `tan`, `dye`, `fire`, `weave`, `survey`)
- POC_SPEC.md §9 (Skilling & Objects)

## Epic goal

Implement object non-skilling interaction routing and the remaining skilling actions: Favour offering, trapping, fishing, and map table survey. This epic closes the gap where most object interactions emit "not yet implemented."

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E25/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E25-S01` — [Object Non-Skilling Interaction Router](completed/stories/E25/E25-S01_object-non-skilling-interaction-router.md)
- [ ] `E25-S02` — [Favour Offering Action](stories/E25/E25-S02_favour-offering-action.md)
- [ ] `E25-S03` — [Fishing Action Support](stories/E25/E25-S03_fishing-action-support.md)
- [ ] `E25-S04` — [Trapping Action Runtime](stories/E25/E25-S04_trapping-action-runtime.md)
- [ ] `E25-S05` — [Map Table Survey Action](stories/E25/E25-S05_map-table-survey-action.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

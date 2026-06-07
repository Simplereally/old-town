# E37 — Crafting and Content Interaction Expansion

## Dependency chain

- Depends on: E36
- Unlocks: E38

## Spec references

- P1 gap 10: Recipe UI / selection runtime
- P1 gap 11: Trapping action runtime
- P1 gap 3: Object non-skilling interaction routing
- docs/content/runtime-gap-list.md
- docs/content/action-wiring-audit.md

## Epic goal

Implement recipe selection UI, extend object interaction routing for all remaining actions, and add trapping/tanning/dyeing mechanics. This closes the crafting and content interaction gaps.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E37/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E37-S01` — [Recipe Selection Packet and UI](stories/E37/E37-S01_recipe-selection-packet-and-ui.md)
- [ ] `E37-S02` — [Extended Object Interaction Routing](stories/E37/E37-S02_extended-object-interaction-routing.md)
- [ ] `E37-S03` — [Trapping Action and Content Wiring](stories/E37/E37-S03_trapping-action-and-content-wiring.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

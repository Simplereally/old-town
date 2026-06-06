# E40 — Oldroad Trails and Exploration

## Dependency chain

- Depends on: E39
- Unlocks: (none)

## Spec references

- P2 gap 12: Oldroad Trails
- P2 gap 14: Charters / permits
- P2 gap 15: Public works
- docs/content/runtime-gap-list.md
- docs/content/action-wiring-audit.md

## Epic goal

Oldroad Trails and Exploration. This epic addresses the remaining gaps in the Old Town vertical slice related to P2 gap 12, P2 gap 14, P2 gap 15.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E40/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories
- [ ] `E40-S01` — [Oldroad Trail Schema and Discovery](stories/E40/E40-S01_oldroad-trail-schema-and-discovery.md)
- [ ] `E40-S02` — [Charter and Permit System](stories/E40/E40-S02_charter-and-permit-system.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

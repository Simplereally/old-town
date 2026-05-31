# E24 — Player Death and Respawn

## Dependency chain

- Depends on: E10
- Unlocks: E25

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 6)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §10 (Combat & Death)

## Epic goal

Implement player death handling, respawn logic, and death penalties. This epic closes the gap where players are marked dead but never respawned, leaving them permanently dead.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E24/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E24-S01` — [Player Death State and Respawn Logic](stories/E24/E24-S01_player-death-state-and-respawn-logic.md)
- [ ] `E24-S02` — [Death Penalty and Grave System](stories/E24/E24-S02_death-penalty-and-grave-system.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

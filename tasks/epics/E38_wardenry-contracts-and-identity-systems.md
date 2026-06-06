# E38 — Wardenry Contracts and Identity Systems

## Dependency chain

- Depends on: E37
- Unlocks: E39

## Spec references

- P1 gap 9: Wardenry contract runtime
- P2 gap 15: Full Favour boons / oaths / rites
- P2 gap 16: Advanced status effects
- docs/content/runtime-gap-list.md
- docs/content/action-wiring-audit.md

## Epic goal

Wardenry Contracts and Identity Systems. This epic addresses the remaining gaps in the Old Town vertical slice related to P1 gap 9, P2 gap 15, P2 gap 16.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E38/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories
- [ ] `E38-S01` — [Wardenry Contract Schema and Runtime](stories/E38/E38-S01_wardenry-contract-schema-and-runtime.md)
- [ ] `E38-S02` — [Combat Contract Kill Tracking](stories/E38/E38-S02_combat-contract-kill-tracking.md)
- [ ] `E38-S03` — [Advanced Status Effects System](stories/E38/E38-S03_advanced-status-effects-system.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

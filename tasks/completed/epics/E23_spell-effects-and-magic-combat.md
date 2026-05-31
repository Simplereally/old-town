# E23 — Spell Effects and Magic Combat

## Dependency chain

- Depends on: E11, E18
- Unlocks: E29

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 4, P1 gaps 12, 14, P2 gap 23)
- docs/content/action-wiring-audit.md (action IDs: `cast`, `teleport`)
- POC_SPEC.md §11 (Magic & Spells)

## Epic goal

Implement spell effect application: damage, bind, teleport, and the magic combat system. This epic closes the gap where spell validation and bead consumption work but no effects are ever applied to targets.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E23/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E23-S01` — [Apply Combat Spell Damage](completed/stories/E23/E23-S01_apply-combat-spell-damage.md)
- [X] `E23-S02` — [Apply Bind and Teleport Effects](completed/stories/E23/E23-S02_apply-bind-and-teleport-effects.md)
- [X] `E23-S03` — [Magic Combat System and XP](completed/stories/E23/E23-S03_magic-combat-system-and-xp.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

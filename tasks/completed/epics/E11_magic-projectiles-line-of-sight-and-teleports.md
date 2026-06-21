# E11 — Magic, Projectiles, Line of Sight, and Teleports

## Dependency chain

- Depends on: E10
- Unlocks: E12

## Spec references

- POC_SPEC.md §5
- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §17
- POC_SPEC.md §27
- POC_SPEC.md §28

## Epic goal

Implement the first spellbook: bead-cost validation, targeted combat spell, projectile/graphic events, delayed magic hits, line-of-sight checks, and interruptible home teleport.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E11/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E11-S01` — [Implement spell validation and bead costs](../completed/stories/E11/E11-S01_implement-spell-validation-and-bead-costs.md)
- [X] `E11-S02` — [Implement combat spell projectile and delayed hit](../completed/stories/E11/E11-S02_implement-combat-spell-projectile-and-delayed-hit.md)
- [X] `E11-S03` — [Implement bind/snare-style movement block hook](../completed/stories/E11/E11-S03_implement-bind-snare-style-movement-block-hook.md)
- [X] `E11-S04` — [Implement interruptible home teleport](../completed/stories/E11/E11-S04_implement-interruptible-home-teleport.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

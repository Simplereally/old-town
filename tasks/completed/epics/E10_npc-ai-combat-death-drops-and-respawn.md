# E10 — NPC AI, Combat, Death, Drops, and Respawn

## Dependency chain

- Depends on: E09
- Unlocks: E11

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §14
- POC_SPEC.md §21
- POC_SPEC.md §27
- POC_SPEC.md §28

## Epic goal

Implement the OSRS-like tick combat core: NPC brains, target validation, melee attacks, rolls, delayed hits, damage, HP, death, loot drops, respawns, auto-retaliation, and combat visibility.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E10/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E10-S01` — [Implement NPC spawn, wander, leash, and respawn AI](../completed/stories/E10/E10-S01_implement-npc-spawn-wander-leash-and-respawn-ai.md)
- [X] `E10-S02` — [Implement combat target acquisition and validation](../completed/stories/E10/E10-S02_implement-combat-target-acquisition-and-validation.md)
- [X] `E10-S03` — [Implement melee attack timing and rolls](../completed/stories/E10/E10-S03_implement-melee-attack-timing-and-rolls.md)
- [X] `E10-S04` — [Apply hits, health bars, hitsplats, and XP](../completed/stories/E10/E10-S04_apply-hits-health-bars-hitsplats-and-xp.md)
- [X] `E10-S05` — [Implement death, drops, ground items, and ownership](../completed/stories/E10/E10-S05_implement-death-drops-ground-items-and-ownership.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

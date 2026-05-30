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

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E10/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E10-S01` — [Implement NPC spawn, wander, leash, and respawn AI](../stories/E10/E10-S01_implement-npc-spawn-wander-leash-and-respawn-ai.md)
- [ ] `E10-S02` — [Implement combat target acquisition and validation](../stories/E10/E10-S02_implement-combat-target-acquisition-and-validation.md)
- [ ] `E10-S03` — [Implement melee attack timing and rolls](../stories/E10/E10-S03_implement-melee-attack-timing-and-rolls.md)
- [ ] `E10-S04` — [Apply hits, health bars, hitsplats, and XP](../stories/E10/E10-S04_apply-hits-health-bars-hitsplats-and-xp.md)
- [ ] `E10-S05` — [Implement death, drops, ground items, and ownership](../stories/E10/E10-S05_implement-death-drops-ground-items-and-ownership.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

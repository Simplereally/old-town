# E13-S05 — Prepare PostgreSQL schema and migration files

## Epic

E13 — Persistence, Character Save/Load, and Item Audit

## Dependency chain

- Depends on: E13-S04
- Blocks: next story in `E13` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §20
- POC_SPEC.md §21
- POC_SPEC.md §25
- POC_SPEC.md §27

## Objective

Create production-ready SQL schema files matching the spec without requiring production DB for local POC.

## Implementation checklist

- [ ] Create migrations for accounts, characters, character_skills, character_inventory, character_equipment, character_quest_vars, character_unlocked_content, character_bank, world_ground_items, audit_item_transactions.
- [ ] Add indexes for character ID, account ID, item audit character/tick, and ground item visibility.
- [ ] Add README for running migrations later.
- [ ] Keep dev adapter default unless DB env is configured.
- [ ] Add schema lint or snapshot test where practical.

## Acceptance criteria

- [ ] SQL schema exists and matches POC_SPEC.md §20.1.
- [ ] Local POC still works without PostgreSQL.
- [ ] Persistence adapter can later gain PostgreSQL implementation without changing systems.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

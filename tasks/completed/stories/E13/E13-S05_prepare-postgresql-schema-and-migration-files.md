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

- [X] Create migrations for accounts, characters, character_skills, character_inventory, character_equipment, character_quest_vars, character_unlocked_content, character_bank, world_ground_items, audit_item_transactions.
- [X] Add indexes for character ID, account ID, item audit character/tick, and ground item visibility.
- [X] Add README for running migrations later.
- [X] Keep dev adapter default unless DB env is configured.
- [X] Add schema lint or snapshot test where practical.

## Acceptance criteria

- [X] SQL schema exists and matches POC_SPEC.md §20.1.
- [X] Local POC still works without PostgreSQL.
- [X] Persistence adapter can later gain PostgreSQL implementation without changing systems.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E13/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

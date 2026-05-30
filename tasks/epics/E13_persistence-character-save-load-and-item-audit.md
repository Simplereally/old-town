# E13 — Persistence, Character Save/Load, and Item Audit

## Dependency chain

- Depends on: E12
- Unlocks: E14

## Spec references

- POC_SPEC.md §20
- POC_SPEC.md §21
- POC_SPEC.md §25
- POC_SPEC.md §27

## Epic goal

Persist character state safely: position, skills, inventory, equipment, quest vars, bank-ready data shape, ground item policy, and item transaction audit trail.

## Completion checklist

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E13/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E13-S01` — [Define persistence adapter interface and dev storage](../stories/E13/E13-S01_define-persistence-adapter-interface-and-dev-storage.md)
- [ ] `E13-S02` — [Persist character core state](../stories/E13/E13-S02_persist-character-core-state.md)
- [ ] `E13-S03` — [Implement dirty-state persistence triggers](../stories/E13/E13-S03_implement-dirty-state-persistence-triggers.md)
- [ ] `E13-S04` — [Implement item transaction audit](../stories/E13/E13-S04_implement-item-transaction-audit.md)
- [ ] `E13-S05` — [Prepare PostgreSQL schema and migration files](../stories/E13/E13-S05_prepare-postgresql-schema-and-migration-files.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

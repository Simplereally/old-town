# E15 — POC Assembly, Integration Tests, Performance, and Final Hardening

## Dependency chain

- Depends on: E14
- Unlocks: Final POC completion

## Spec references

- POC_SPEC.md §26
- POC_SPEC.md §27
- POC_SPEC.md §28
- POC_SPEC.md §29
- POC_SPEC.md §30

## Epic goal

Turn the built systems into a coherent minimal playable POC and lock it down with integration tests, debug verification, performance checks, content originality checks, and final acceptance against the spec.

## Completion checklist

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E15/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E15-S01` — [Create end-to-end POC route and bootstrap script](../stories/E15/E15-S01_create-end-to-end-poc-route-and-bootstrap-script.md)
- [ ] `E15-S02` — [Write movement, interaction, and networking integration tests](../stories/E15/E15-S02_write-movement-interaction-and-networking-integration-tests.md)
- [ ] `E15-S03` — [Write gameplay loop integration tests](../stories/E15/E15-S03_write-gameplay-loop-integration-tests.md)
- [ ] `E15-S04` — [Add performance and leak checks](../stories/E15/E15-S04_add-performance-and-leak-checks.md)
- [ ] `E15-S05` — [Run final spec compliance pass](../stories/E15/E15-S05_run-final-spec-compliance-pass.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.

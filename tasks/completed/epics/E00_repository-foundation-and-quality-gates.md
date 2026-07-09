# E00 — Repository Foundation and Quality Gates

## Dependency chain

- Depends on: None
- Unlocks: E01

## Spec references

- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26
- POC_SPEC.md §27

## Epic goal

Create the empty-codebase foundation required for every later epic: monorepo layout, TypeScript configuration, package scripts, formatting, linting, testing, shared conventions, and deterministic validation commands.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E00/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E00-S01` — [Initialize monorepo workspace](../stories/E00/E00-S01_initialize-monorepo-workspace.md)
- [X] `E00-S02` — [Configure TypeScript project references](../stories/E00/E00-S02_configure-typescript-project-references.md)
- [X] `E00-S03` — [Configure formatting, linting, and import hygiene](../stories/E00/E00-S03_configure-formatting-linting-and-import-hygiene.md)
- [X] `E00-S04` — [Configure test runner and coverage shell](../stories/E00/E00-S04_configure-test-runner-and-coverage-shell.md)
- [X] `E00-S05` — [Create task workflow conventions](../stories/E00/E00-S05_create-task-workflow-conventions.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.

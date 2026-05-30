# E15-S05 — Run final spec compliance pass

## Epic

E15 — POC Assembly, Integration Tests, Performance, and Final Hardening

## Dependency chain

- Depends on: E15-S04
- Blocks: next story in `E15` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §26
- POC_SPEC.md §27
- POC_SPEC.md §28
- POC_SPEC.md §29
- POC_SPEC.md §30

## Objective

Verify the implementation against the POC_SPEC.md acceptance shape and clean up all remaining task artifacts.

## Implementation checklist

- [ ] Review every section of POC_SPEC.md §26-§30 against implementation.
- [ ] Check every epic/story checkbox and move completed files into tasks/completed after completion.
- [ ] Remove dead code, unused content, temporary hacks, and duplicate constants.
- [ ] Run all validation commands from README.
- [ ] Create FINAL_POC_REPORT.md summarizing implemented systems, commands, known gaps, and next epics after POC.

## Acceptance criteria

- [ ] All tests, typecheck, lint, format check, and content validation pass.
- [ ] FINAL_POC_REPORT.md exists and is accurate.
- [ ] No incomplete story remains outside completed folders unless explicitly documented as a known gap.

## Validation commands

- [ ] `bun run format:check`
- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run content:validate`
- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

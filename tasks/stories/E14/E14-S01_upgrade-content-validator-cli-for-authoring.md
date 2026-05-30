# E14-S01 — Upgrade content validator CLI for authoring

## Epic

E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E13-S05
- Blocks: next story in `E14` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Make validation errors actionable enough for an agent or designer to fix content quickly.

## Implementation checklist

- [ ] Improve `content:validate` output with file path, JSON pointer, ID, dependency chain, and suggested fix class.
- [ ] Add `content:list` command for registries.
- [ ] Add `content:graph` or textual dependency graph output.
- [ ] Add validation for unused IDs where safe.
- [ ] Add tests for error message shape.

## Acceptance criteria

- [ ] Invalid content points to the exact offending file and field.
- [ ] Registry/dependency output helps maintain large content sets.
- [ ] Validator remains CI-friendly.

## Validation commands

- [ ] `bun run content:validate`
- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

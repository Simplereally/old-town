# E00-S05 — Create task workflow conventions

## Epic

E00 — Repository Foundation and Quality Gates

## Dependency chain

- Depends on: E00-S04
- Blocks: next story in `E00` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26
- POC_SPEC.md §27

## Objective

Make the tasks folder self-describing so later agents can safely progress linearly.

## Implementation checklist

- [X] Create or update tasks/README.md with linear execution rules.
- [X] Document how to mark checkboxes complete.
- [X] Document how to move completed epics/stories into tasks/completed.
- [X] Document that POC_SPEC.md is the source of truth when any task seems under-specified.
- [X] Add a root `tasks:status` script or documented shell command to list unchecked items.

## Acceptance criteria

- [X] An agent can determine the next story without asking.
- [X] Completed-folder convention is explicitly documented.
- [X] No task requires time estimates or subjective signoff.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E00/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

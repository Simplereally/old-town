# Old Town Task Tree

This folder is designed for an AI agent starting from a fresh repository containing only
`POC_SPEC.md` and this task tree. It is self-describing: an agent can determine exactly
what to do next without asking for clarification.

## Layout

```txt
tasks/
  epics/          — active epic files (E00, E01, ...), one per epic
  stories/E##/    — active story files for each epic, in numeric order
  completed/
    epics/        — finished epic files (moved here when all stories are done)
    stories/E##/  — finished story files (moved here when the story is complete)
  TASK_MANIFEST.json — machine-readable index of the full tree
```

Whatever still sits under `epics/` and `stories/` is remaining work; anything under
`completed/` is done.

## Execution rule

Work strictly linearly by epic number, then by story number:

1. Complete all stories in `epics/E00_*` before starting `E01`.
2. Complete every story file under `stories/E00/` in numeric order. Do not skip ahead.
3. Mark every completed checkbox as `[X]` (see below).
4. When a story is fully complete, move that story file to `completed/stories/E##/`,
   preserving the filename.
5. When every story in an epic is complete, mark the epic file's checklist complete and
   move the epic file to `completed/epics/`.
6. Continue until `tasks/epics/` is empty.

## Determining the next story

Run:

```sh
bun run tasks:status
```

It prints the lowest-numbered remaining epic, the lowest-numbered remaining story in that
epic, and a per-epic summary of what is left. The first story it prints is the one to work
on next. (You can also read it directly: the next epic is the lowest-numbered file in
`epics/`, and the next story is the lowest-numbered file in the matching `stories/E##/`.)

## Marking progress

Checkboxes use GitHub-flavored Markdown task syntax. To mark an item complete, change its
box from unchecked to checked:

```diff
- - [ ] Some acceptance criterion
+ - [X] Some acceptance criterion
```

Within a story file, mark every implementation-checklist, acceptance-criteria, and
validation-command item `[X]` only after it is genuinely satisfied. In the parent epic
file, mark the story's line `[X]` when the story is complete and update its link to point
at the moved file under `completed/`.

## Moving completed files

Use a plain move that preserves the filename. Create the destination subfolder if needed.

```sh
# Story
mv tasks/stories/E03/E03-S02_*.md tasks/completed/stories/E03/

# Epic (after all its stories are complete)
mv tasks/epics/E03_*.md tasks/completed/epics/
```

Only move files after all checkboxes and acceptance criteria are satisfied and the
story's validation commands pass.

## Source of truth

`POC_SPEC.md` is authoritative for all engine behavior, data formats, and acceptance
tests. If a task file seems under-specified or appears to contradict `POC_SPEC.md`, obey
`POC_SPEC.md` — unless a later task file explicitly narrows the POC scope without
contradicting it.

## Required validation discipline

Run the validation commands listed in each story before marking it complete. Keep the
standard gates green between stories (`bun run typecheck`, `bun run check`,
`bun run test`, and — once it exists — `bun run content:validate`). Add or improve tests
whenever a story creates deterministic behavior that can regress. Never leave a broken
build between completed stories.

## No ambiguity rule

Do not ask for product clarification while executing these tasks. Use the explicit
requirements in `POC_SPEC.md`, the current epic, and the current story. Make the smallest
technically correct decision that preserves server authority, integer-tile truth, 600ms
tick determinism, content-driven definitions, and future extensibility. Document any such
decision in the relevant file and continue. Do not add time estimates or subjective
sign-off steps.

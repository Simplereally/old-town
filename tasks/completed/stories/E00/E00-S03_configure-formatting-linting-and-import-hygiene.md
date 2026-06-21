# E00-S03 — Configure formatting, linting, and import hygiene

## Epic

E00 — Repository Foundation and Quality Gates

## Dependency chain

- Depends on: E00-S02
- Blocks: next story in `E00` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26
- POC_SPEC.md §27

## Objective

Install and configure deterministic formatting/linting gates for agent-safe iteration.

## Implementation checklist

- [X] Add Biome or equivalent single-command formatter/linter.
- [X] Define import ordering and unused import behavior.
- [X] Add root scripts `format`, `format:check`, `lint`.
- [X] Exclude generated caches, build folders, and coverage from linting.
- [X] Document the exact commands in README.md.

## Acceptance criteria

- [X] `bun run format:check` passes.
- [X] `bun run lint` passes.
- [X] Running `bun run format` does not rewrite generated or ignored folders.

## Validation commands

- [X] `bun run format:check`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E00/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

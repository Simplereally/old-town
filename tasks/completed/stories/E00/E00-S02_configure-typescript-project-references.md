# E00-S02 — Configure TypeScript project references

## Epic

E00 — Repository Foundation and Quality Gates

## Dependency chain

- Depends on: E00-S01
- Blocks: next story in `E00` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26
- POC_SPEC.md §27

## Objective

Make TypeScript strict, shared, and buildable across client, server, shared, and tools.

## Implementation checklist

- [X] Create root tsconfig.base.json with strict settings.
- [X] Create per-package tsconfig.json files.
- [X] Configure path aliases for shared imports.
- [X] Ensure no implicit any, no unchecked indexed access, and exact optional property types where practical.
- [X] Add `typecheck` root script that checks every workspace.

## Acceptance criteria

- [X] `bun run typecheck` passes on empty scaffold.
- [X] No package relies on relative imports that cross package boundaries.

## Validation commands

- [X] `bun run typecheck`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E00/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

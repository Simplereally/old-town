# E00-S01 — Initialize monorepo workspace

## Epic

E00 — Repository Foundation and Quality Gates

## Dependency chain

- Depends on: None
- Blocks: next story in `E00` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26
- POC_SPEC.md §27

## Objective

Create the canonical apps/client, apps/server, packages/shared, content, tools, and tasks-adjacent project structure.

## Implementation checklist

- [X] Create package.json workspace root using Bun-compatible scripts.
- [X] Create apps/client, apps/server, packages/shared, content, tools/world-editor, tools/content-validator.
- [X] Add README.md with local dev commands and architecture map.
- [X] Add .gitignore, .editorconfig, .gitattributes with LF normalization.
- [X] Add empty .env.example files for client and server where needed.

## Acceptance criteria

- [X] `bun install` succeeds from the repository root.
- [X] Repository has no generated build artifacts checked in.
- [X] Directory layout matches POC_SPEC.md §25.

## Validation commands

- [X] `bun install`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E00/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

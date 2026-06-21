# E15-S01 — Create end-to-end POC route and bootstrap script

## Epic

E15 — POC Assembly, Integration Tests, Performance, and Final Hardening

## Dependency chain

- Depends on: E14-S05
- Blocks: next story in `E15` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §26
- POC_SPEC.md §27
- POC_SPEC.md §28
- POC_SPEC.md §29
- POC_SPEC.md §30

## Objective

Make a single command start the server, client, seed content, and dev character flow.

## Implementation checklist

- [X] Add root `dev` script that runs server and client together.
- [X] Add documented ports and environment defaults.
- [X] Ensure first browser visit connects, spawns, and renders the seed region.
- [X] Ensure two tabs show two players.
- [X] Add troubleshooting section for common startup failures.

## Acceptance criteria

- [X] A fresh clone can run the POC with documented commands.
- [X] No manual content generation step is required before launch.
- [X] Two-client multiplayer smoke path works.

## Validation commands

- [X] `bun run dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

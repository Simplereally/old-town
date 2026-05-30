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

- [ ] Add root `dev` script that runs server and client together.
- [ ] Add documented ports and environment defaults.
- [ ] Ensure first browser visit connects, spawns, and renders the seed region.
- [ ] Ensure two tabs show two players.
- [ ] Add troubleshooting section for common startup failures.

## Acceptance criteria

- [ ] A fresh clone can run the POC with documented commands.
- [ ] No manual content generation step is required before launch.
- [ ] Two-client multiplayer smoke path works.

## Validation commands

- [ ] `bun run dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E15/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

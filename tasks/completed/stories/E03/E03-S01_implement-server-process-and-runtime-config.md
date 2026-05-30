# E03-S01 — Implement server process and runtime config

## Epic

E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E02-S06
- Blocks: next story in `E03` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Objective

Create the server app entry point with environment loading, content loading, graceful shutdown, and health endpoints/logging.

## Implementation checklist

- [X] Create apps/server entry point.
- [X] Load and validate content at boot.
- [X] Expose runtime config for port, tick interval, persistence mode, and debug flags.
- [X] Add structured logging.
- [X] Implement graceful shutdown that stops tick loop and closes sockets when later added.

## Acceptance criteria

- [X] Server boots with seed content.
- [X] Server fails fast on invalid content.
- [X] No gameplay starts if content validation fails.

## Validation commands

- [X] `bun run server:dev`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

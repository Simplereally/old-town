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

- [ ] Create apps/server entry point.
- [ ] Load and validate content at boot.
- [ ] Expose runtime config for port, tick interval, persistence mode, and debug flags.
- [ ] Add structured logging.
- [ ] Implement graceful shutdown that stops tick loop and closes sockets when later added.

## Acceptance criteria

- [ ] Server boots with seed content.
- [ ] Server fails fast on invalid content.
- [ ] No gameplay starts if content validation fails.

## Validation commands

- [ ] `bun run server:dev`
- [ ] `bun run content:validate`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.

# E03-S04 — Implement command buffer and validation pipeline

## Epic

E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E03-S03
- Blocks: next story in `E03` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Objective

Ingest intent commands into a per-tick command buffer and reject invalid/malformed/duplicate commands.

## Implementation checklist

- [X] Create command buffer keyed by player/entity.
- [X] Validate command envelopes using shared schemas.
- [X] Reject duplicate command IDs per connection/player.
- [X] Normalize accepted commands into internal intents.
- [X] Add tests for accepted, rejected, duplicate, and late commands.

## Acceptance criteria

- [X] Malformed commands cannot reach simulation systems.
- [X] Commands are consumed at deterministic tick boundaries.
- [X] Command buffer exposes no direct mutation APIs to client code.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

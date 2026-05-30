# E05-S04 — Wire command transport into simulation command buffer

## Epic

E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E05-S03
- Blocks: next story in `E05` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Allow clients to send typed intents that are validated, buffered, and consumed on tick boundaries.

## Implementation checklist

- [X] Decode client command envelopes.
- [X] Reject invalid commands with error packet or structured log.
- [X] Route accepted commands to CommandBuffer.
- [X] Protect against command spam with per-tick caps.
- [X] Add tests for move command from socket through movement delta.

## Acceptance criteria

- [X] Client movement occurs only after server tick processing.
- [X] Duplicate command IDs are ignored.
- [X] Out-of-range or malformed commands are rejected.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

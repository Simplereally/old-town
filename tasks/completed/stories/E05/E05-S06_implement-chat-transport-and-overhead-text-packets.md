# E05-S06 — Implement chat transport and overhead text packets

## Epic

E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E05-S05
- Blocks: next story in `E05` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Support simple local chat and overhead text as first multiplayer social loop.

## Implementation checklist

- [X] Add ChatIntent validation and rate limits.
- [X] Emit chat packets to nearby interested players.
- [X] Emit overhead text update mask for speaking entity.
- [X] Render/log chat on client placeholder UI.
- [X] Add profanity filtering hook as a stub, not a hardcoded policy system.

## Acceptance criteria

- [X] Nearby clients receive chat messages.
- [X] Distant clients outside interest do not receive local overhead text.
- [X] Chat cannot contain malformed packet payloads.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

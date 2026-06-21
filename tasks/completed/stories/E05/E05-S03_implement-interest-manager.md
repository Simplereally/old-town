# E05-S03 — Implement interest manager

## Epic

E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E05-S02
- Blocks: next story in `E05` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Filter world state and deltas by each player’s active 104x104 scene.

## Implementation checklist

- [X] Compute interest scene around player tile.
- [X] Compute intersecting chunks and regions.
- [X] Filter entity adds/removes/updates by interest area.
- [X] Emit region/chunk load and unload packets when crossing chunk boundaries.
- [X] Add tests for visibility enter/exit and chunk boundary crossing.

## Acceptance criteria

- [X] Players only receive entities and chunks inside their interest scene.
- [X] Interest logic uses ACTIVE_SCENE_SIZE and CHUNK_SIZE shared constants.
- [X] Entity removal is sent when an entity leaves interest.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

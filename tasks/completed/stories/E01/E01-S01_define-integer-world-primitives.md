# E01-S01 — Define integer world primitives

## Epic

E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E00-S05
- Blocks: next story in `E01` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Objective

Implement canonical shared types and helpers for ticks, tile coordinates, planes, chunks, regions, and packed keys.

## Implementation checklist

- [X] Create branded or opaque types for EntityId, ItemId, NpcId, ObjectId, RegionId, ChunkId, Tick.
- [X] Implement TileCoord, ChunkCoord, RegionCoord, LocalSceneCoord.
- [X] Implement helpers for tile -> chunk -> region conversion.
- [X] Implement stable string keys and optional packed numeric keys.
- [X] Add tests for boundary values, negative coordinates, and plane handling.

## Acceptance criteria

- [X] No gameplay package uses raw `{x,y}` without TileCoord where tile truth is required.
- [X] Conversion tests prove 8x8 chunks and 64x64 regions.
- [X] Constants match POC_SPEC.md §4.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E01/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

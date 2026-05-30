# E01-S04 — Define server-to-client delta protocol

## Epic

E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E01-S03
- Blocks: next story in `E01` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Objective

Create the shared packet contracts for authoritative snapshots, tick deltas, entity adds/removes, region loads, inventory deltas, skill deltas, varbit deltas, chat, hitsplats, XP drops, sounds, and interfaces.

## Implementation checklist

- [X] Define FullStatePacket and TickDeltaPacket.
- [X] Define EntitySpawnPacket, EntityRemovePacket, EntityUpdatePacket.
- [X] Define InventoryDelta, SkillDelta, VarbitDelta, ChatPacket, HitsplatPacket, XpDropPacket.
- [X] Define protocol version field and compatibility guard.
- [X] Add serialization/deserialization tests.

## Acceptance criteria

- [X] Every outgoing packet includes server tick where relevant.
- [X] Packets contain no Three.js/vector classes.
- [X] Protocol version mismatch is detectable.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E01/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

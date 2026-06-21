# E32-S04 - Pure Packet Ingestion

## Epic

E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E32-S03
- Blocks: E32-S05, E32-S06

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/snapshot-interpolation.md
- POC_SPEC.md §8.4

## Objective

Refactor client server-packet handling so network callbacks reduce packets into pure client state and `SnapshotBuffer`, not directly into scene layers.

## Implementation checklist

- [X] Write failing tests in `apps/client/src/game/net/ClientPacketIngestor.test.ts`.
- [X] Create `apps/client/src/game/net/ClientWorldStore.ts` for pure render-relevant client world state.
- [X] Create `apps/client/src/game/net/ClientPacketIngestor.ts`.
- [X] Move entity add/update/remove reduction from `ClientPacketApplier` into `ClientPacketIngestor` or make `ClientPacketApplier` pure by changing its context to `ClientWorldStore`, `SnapshotBuffer`, UI state, and debug event queues.
- [X] Preserve full-state semantics: clear prior client world state, reset snapshot buffer, apply all entities, apply UI state, and sync `RenderClock`.
- [X] Preserve tick-delta semantics: reject stale ticks through `SnapshotBuffer`, apply region load/unload metadata to pure queues, apply entity adds/removes/updates to store, emit UI deltas, emit presentation events, and insert a render snapshot.
- [X] Populate `RenderSnapshot.sequence` as `packet.snapshotSequence` if that field exists in a future protocol, otherwise `packet.tick`; do not add binary encoding in this story.
- [X] Keep chat, dialogue, inventory, equipment, skills, vars, command rejection feedback, and debug data behavior functionally equivalent to the pre-refactor client.
- [X] Do not call `terrain.loadChunk`, `terrain.unloadRegion`, `objects.spawn`, `actors.spawn`, `actors.updateTile`, `groundItems.spawn`, `hitsplats.show`, `projectiles.spawn`, `chatOverhead.show`, or any scene-layer method from WebSocket callbacks.
- [X] Update `GameEngine` so `socket.onTickDelta` calls the pure ingestor and stores returned UI/debug/presentation event data for render systems.
- [X] Keep `ClientCommandDispatcher` current tick hints sourced from accepted authoritative ticks only.
- [X] Add tests proving packet callbacks do not call scene-layer methods.

## Acceptance criteria

- [X] Full state and tick delta ingestion produce deterministic `ClientWorldStore` state and `RenderSnapshot` output.
- [X] Stale tick deltas are ignored and do not mutate state or UI.
- [X] Existing `ClientPacketApplier` tests are either migrated or updated so behavior coverage is not lost.
- [X] No network callback directly mutates Three scene layers.
- [X] UI state updates still occur only from server packets and command rejection feedback, not render interpolation.
- [X] `GameEngine` still reports current tick from the latest accepted authoritative packet.

## Validation commands

- [X] `bun run test -- apps/client/src/game/net/ClientPacketIngestor.test.ts`
- [X] `bun run test -- apps/client/src/game/net/ClientPacketApplier.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E32/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.

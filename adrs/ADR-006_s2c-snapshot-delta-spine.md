# ADR-006: Server-to-Client Snapshot/Delta Spine

## Status

Accepted

## Context

`GameEngine` was the only place that understood `FullStatePacket` and `TickDeltaPacket` semantics. It directly mutated `TerrainLayer`, `ObjectRenderer`, `ActorRenderer`, `GroundItemLayer`, `HitsplatLayer`, `ChatOverheadLayer`, `DebugLayer`, and `UIState` — 300+ lines of packet-application logic inside the top-level orchestrator. `DevSessionManager` on the server had its own `visibleEntitySpawns()` method that only projected players, even though the world already contained objects, NPCs, and ground items.

The problems were:
1. **Packet application scattered** — `GameEngine` mixed socket lifecycle, overlay updates, debug logging, and packet fan-out in one file.
2. **Ground items silently ignored** — `FullStatePacket.entities` and `TickDeltaPacket.entityAdds` were processed with a switch that only handled `player`, `npc`, and `object`; `ground_item` packets were silently dropped.
3. **Entity removes only touched actors and objects** — `groundItems.remove(id)` was never called, so removed ground items stayed rendered.
4. **No authoritative reset on full state** — `FullStatePacket` was applied additively over whatever layers already held, so stale entities from a previous connection could persist.
5. **Server projection incomplete** — `DevSessionManager.visibleEntitySpawns()` only created spawn packets for players, missing map objects, NPCs, and dropped items.
6. **Debug path logic mixed with packet application** — move-rejection tracking (`_lastClickTile`, `_lastClickTick`) and path logging were inline in `GameEngine`.

## Decision

1. **Extract `EntitySpawnProjector` on the server.** A new pure module `apps/server/src/net/entity-spawn-projector.ts` maps every alive `World` entity to its `EntitySpawnPacket` deterministically:
   - `player` component → `kind: "player"`, optional `appearance` and `healthBar`
   - `npc` component → `kind: "npc"`, optional `appearance` and `healthBar`
   - `object` component → `kind: "object"`
   - `groundItem` component → `kind: "ground_item"`, includes `quantity`
   - Missing `position` → skipped (reported in `skipped` array, never silently dropped)
   - Unrecognised kind with position → silently skipped (not an error; some entities like resource nodes are represented by their parent object)
   - `projectEntity(world, id)` projects a single entity.
   - `projectWorldEntities(world)` projects all alive entities and returns `{ spawns, skipped }`.
   - `spawnKind(world, id)` returns the spawn kind without building the full packet.

2. **Extract `ClientPacketApplier` on the client.** A new module `apps/client/src/game/net/ClientPacketApplier.ts` owns all S2C packet semantics behind a small interface:
   - `applyFullState(packet)` — authoritative reset: clears all layers, loads terrain, spawns all entities, sets inventory/skills/vars.
   - `applyTickDelta(packet, currentTick)` — incremental: region unloads/loads, entity adds/removes, actor updates, hitsplats, UI deltas, chat, interface opens, debug data.
   - `recordClickTile(tile, tick)` — stores the last click tile for move-rejection tracking.
   - Returns `PacketApplierResult` with `{ tick, serverTime, selfEntityId, rejectedMoves }`.

3. **`GameEngine` delegates only.** `GameEngine` routes `socket.connect().then(fullState)` and `socket.onTickDelta` into `ClientPacketApplier`, then updates its own `_currentTick`, `_serverTime`, `_selfEntityId`, and `_dispatcher.setCurrentTick()` from the returned result. No packet-application logic remains in `GameEngine`.

4. **`selfEntityId` is stateful inside `ClientPacketApplier`.** The applier extracts `selfEntityId` from the first `applyFullState` call and stores it internally. All subsequent `applyTickDelta` calls use this stored value for self-equipment checks, debug path filtering, and the returned result.

5. **Unknown entity kinds are logged, never silently dropped.** `_spawnEntity` logs `Unknown entity kind in spawn: ${kind}` via `ctx.logDebug` so the developer sees the gap immediately.

6. **Server uses `EntitySpawnProjector` in `DevSessionManager`.** `DevSessionManager` replaces `visibleEntitySpawns()` with `projectWorldEntities(world)` so the full state includes all entity kinds.

## Consequences

- `GameEngine.ts` shrinks further — packet-application methods (`_handleFullState`, `_handleTickDelta`, `_handleDebugPaths`, `_syncEquipment`) are removed entirely. Only thin delegation wrappers remain until the connect/tickDelta callbacks can be inlined.
- `ClientPacketApplier.ts` is ~340 lines. All S2C packet semantics are in one place: terrain, entities, UI, chat, debug.
- `EntitySpawnProjector.ts` is ~190 lines. Adding a new spawnable kind only requires adding a branch in `projectEntity` and `spawnKind`.
- `GameEngine` no longer has packet-application logic beyond delegation. Adding a new packet field only requires changing `ClientPacketApplier`.
- Full state is now an authoritative reset — all layers are cleared before applying the snapshot, so reconnecting or respawning cannot leave stale entities.
- Ground items are now properly handled on both ends: server projects them, client spawns/removes them.
- `ClientPacketApplier.test.ts` (21 tests) proves: authoritative reset, selfEntityId tracking, all entity kinds, unknown kind logging, move-rejection tracking, debug overlay application, UI deltas, chat overhead filtering.
- `EntitySpawnProjector.test.ts` (9 tests) proves: player/npc/object/ground_item projection, missing position skip, dead entity skip, spawnKind accuracy.
- The durable terms are:
  - **Spawn projection** — deterministic ECS → spawn packet mapping
  - **Authoritative reset** — full state clears all layers before applying
  - **Packet applier** — owns all S2C mutation semantics, GameEngine only routes
  - **Self entity tracking** — applier stores selfEntityId from full state and uses it for all subsequent deltas

## Related

- `POC_SPEC.md` §8 (network protocol) and §25 (architecture map)
- `apps/client/src/game/GameEngine.ts`
- `apps/client/src/game/net/ClientPacketApplier.ts`
- `apps/client/src/game/net/ClientPacketApplier.test.ts`
- `apps/server/src/net/entity-spawn-projector.ts`
- `apps/server/src/net/entity-spawn-projector.test.ts`
- `apps/server/src/net/dev-session.ts`
- `packages/shared/src/protocol/packets.ts`
- `packages/shared/src/protocol/entity-update.ts`

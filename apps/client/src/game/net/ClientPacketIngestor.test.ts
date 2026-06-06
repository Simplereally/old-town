import {
  Direction,
  type EntityId,
  type EntitySpawnPacket,
  entityId,
  type FullStatePacket,
  type RegionId,
  ServerPacketType,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { RenderClock } from "../renderer/RenderClock";
import { UIState } from "../ui/UIState";
import { ClientPacketApplier } from "./ClientPacketApplier";
import { ClientPacketIngestor } from "./ClientPacketIngestor";
import { ClientWorldStore } from "./ClientWorldStore";
import { SnapshotBuffer } from "./SnapshotBuffer";

function eid(value: number): EntityId {
  return entityId(value);
}

function rid(value: string): RegionId {
  return value as RegionId;
}

function createTestSetup() {
  const store = new ClientWorldStore();
  const snapshotBuffer = new SnapshotBuffer({
    tickMs: 600,
    interpolationDelayMs: 600,
    maxSnapshots: 32,
    freezeAfterMissingTicks: 2,
    snapAfterMissingTicks: 6,
  });
  const uiState = new UIState();
  const renderClock = new RenderClock({
    tickMs: 600,
    interpolationDelayMs: 600,
    maxFrameDeltaMs: 100,
    serverTimeSmoothing: 0.1,
  });
  const logDebug = vi.fn();

  const applier = new ClientPacketApplier({
    store,
    snapshotBuffer,
    uiState,
    logDebug,
    tileSizeWorldUnits: 1,
  });

  const ingestor = new ClientPacketIngestor(applier, renderClock);

  return { ingestor, store, snapshotBuffer, uiState, renderClock, logDebug };
}

function fullStatePacket(partial: Record<string, unknown> = {}): FullStatePacket {
  return {
    type: ServerPacketType.FullState,
    protocolVersion: 1,
    tick: 1,
    serverTime: 1000,
    selfEntityId: eid(42),
    entities: [],
    regionLoads: [],
    ...partial,
  } as unknown as FullStatePacket;
}

function tickDeltaPacket(partial: Record<string, unknown> = {}): TickDeltaPacket {
  return {
    type: ServerPacketType.TickDelta,
    tick: 2,
    serverTime: 1600,
    entityAdds: [],
    entityRemoves: [],
    entityUpdates: [],
    ...partial,
  } as unknown as TickDeltaPacket;
}

function spawnPlayer(id: number, tile: TileCoord): EntitySpawnPacket {
  return {
    entityId: eid(id),
    kind: "player",
    tile,
    moveSpeed: "stationary",
    appearance: { name: "Hero", bodyId: "dev" },
  };
}

function spawnNpc(id: number, tile: TileCoord, defId = "goblin"): EntitySpawnPacket {
  return {
    entityId: eid(id),
    kind: "npc",
    tile,
    defId,
    moveSpeed: "stationary",
  };
}

function spawnObject(id: number, tile: TileCoord, defId = "tree"): EntitySpawnPacket {
  return {
    entityId: eid(id),
    kind: "object",
    tile,
    defId,
  };
}

function spawnGroundItem(
  id: number,
  tile: TileCoord,
  defId = "coin",
  quantity = 1,
): EntitySpawnPacket {
  return {
    entityId: eid(id),
    kind: "ground_item",
    tile,
    defId,
    quantity,
  };
}

describe("ClientPacketIngestor", () => {
  it("ingestFullState does not call any scene-layer methods", () => {
    const { ingestor } = createTestSetup();
    const result = ingestor.ingestFullState(
      fullStatePacket({
        entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })],
        regionLoads: [{ regionId: rid("r1"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
      }),
      0,
    );
    // The result is pure data: events, snapshot, UI state mutations.
    // No scene-layer calls happened because there are no scene layers.
    expect(result.presentationEvents.length).toBeGreaterThan(0);
    expect(result.snapshot).toBeDefined();
    expect(result.snapshot.tick).toBe(1);
  });

  it("ingestTickDelta does not call any scene-layer methods", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ selfEntityId: eid(42) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        entityAdds: [spawnNpc(10, { x: 0, y: 0, plane: 0 })],
        entityRemoves: [eid(5)],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.presentationEvents.length).toBeGreaterThan(0);
    expect(result!.snapshot).toBeDefined();
  });

  it("ingestFullState clears prior store and resets snapshot buffer", () => {
    const { ingestor, store, snapshotBuffer } = createTestSetup();
    ingestor.ingestFullState(
      fullStatePacket({ tick: 5, entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
      0,
    );
    expect(store.getEntity(1)).toBeDefined();
    expect(snapshotBuffer.latestAcceptedTick).toBe(5);
    expect(snapshotBuffer.depth).toBe(1);

    ingestor.ingestFullState(
      fullStatePacket({ tick: 10, entities: [spawnPlayer(2, { x: 1, y: 1, plane: 0 })] }),
      0,
    );
    expect(store.getEntity(1)).toBeUndefined();
    expect(store.getEntity(2)).toBeDefined();
    expect(snapshotBuffer.latestAcceptedTick).toBe(10);
    expect(snapshotBuffer.depth).toBe(1);
  });

  it("ingestFullState populates store with correct entity data", () => {
    const { ingestor, store } = createTestSetup();
    ingestor.ingestFullState(
      fullStatePacket({
        selfEntityId: eid(42),
        entities: [
          spawnPlayer(42, { x: 5, y: 5, plane: 0 }),
          spawnNpc(1, { x: 1, y: 1, plane: 0 }, "guard"),
          spawnObject(2, { x: 2, y: 2, plane: 0 }, "rock"),
          spawnGroundItem(3, { x: 3, y: 3, plane: 0 }, "sword", 1),
        ],
      }),
      0,
    );

    const player = store.getEntity(42);
    expect(player).toBeDefined();
    expect(player!.kind).toBe("player");
    expect(player!.isLocalPlayer).toBe(true);
    expect(player!.defId).toBe("player");

    const npc = store.getEntity(1);
    expect(npc).toBeDefined();
    expect(npc!.kind).toBe("npc");
    expect(npc!.isLocalPlayer).toBe(false);
    expect(npc!.defId).toBe("guard");

    const obj = store.getEntity(2);
    expect(obj).toBeDefined();
    expect(obj!.kind).toBe("object");
    expect(obj!.defId).toBe("rock");

    const item = store.getEntity(3);
    expect(item).toBeDefined();
    expect(item!.kind).toBe("groundItem");
    expect(item!.defId).toBe("sword");
    expect(item!.quantity).toBe(1);
  });

  it("ingestFullState returns correct tick, serverTime, and selfEntityId", () => {
    const { ingestor } = createTestSetup();
    const result = ingestor.ingestFullState(
      fullStatePacket({ tick: 10, serverTime: 5000, selfEntityId: eid(7) }),
      0,
    );
    expect(result.tick).toBe(10);
    expect(result.serverTime).toBe(5000);
    expect(result.selfEntityId).toBe(7);
    expect(result.rejectedMoves).toEqual([]);
  });

  it("ingestFullState emits presentation events for all operations", () => {
    const { ingestor } = createTestSetup();
    const result = ingestor.ingestFullState(
      fullStatePacket({
        entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })],
        regionLoads: [{ regionId: rid("r1"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
      }),
      0,
    );

    const eventTypes = result.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("actors.clear");
    expect(eventTypes).toContain("objects.clear");
    expect(eventTypes).toContain("groundItems.clear");
    expect(eventTypes).toContain("hitsplats.clear");
    expect(eventTypes).toContain("xpDrops.clear");
    expect(eventTypes).toContain("projectiles.clear");
    expect(eventTypes).toContain("chatOverhead.clear");
    expect(eventTypes).toContain("region.load");
    expect(eventTypes).toContain("actors.spawn");
  });

  it("ingestFullState updates UI state directly", () => {
    const { ingestor, uiState } = createTestSetup();
    const inventory = {
      containerId: "inventory",
      changes: [{ slot: 0, itemId: "coin", quantity: 5 }],
    };
    const skills = [{ skillId: "attack", level: 1, xp: 0, effectiveLevel: 1 }];
    const vars = [{ varId: "quest", value: 1 }];
    const equipment = { slots: ["helm", null, "amulet"] };

    ingestor.ingestFullState(fullStatePacket({ inventory, equipment, skills, vars }), 0);

    expect(uiState.inventory.get(0)?.itemId).toBe("coin");
    expect(uiState.skills.get("attack")?.level).toBe(1);
    expect(uiState.vars.get("quest")).toBe(1);
    expect(uiState.equipment.get(0)).toBe("helm");
  });

  it("ingestTickDelta rejects stale ticks", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 5 }), 0);
    const result = ingestor.ingestTickDelta(tickDeltaPacket({ tick: 4 }), 5, 0);
    expect(result).toBeNull();
  });

  it("ingestTickDelta accepts future ticks", () => {
    const { ingestor, store, snapshotBuffer } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 5, selfEntityId: eid(1) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 6,
        entityAdds: [spawnNpc(10, { x: 0, y: 0, plane: 0 })],
      }),
      5,
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.tick).toBe(6);
    expect(store.getEntity(10)).toBeDefined();
    expect(snapshotBuffer.latestAcceptedTick).toBe(6);
  });

  it("ingestTickDelta emits terrain load/unload events", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        regionUnloads: [{ regionId: rid("old") }],
        regionLoads: [{ regionId: rid("new"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("region.unload");
    expect(eventTypes).toContain("region.load");
  });

  it("ingestTickDelta emits entity add/remove events", () => {
    const { ingestor, store } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        entityAdds: [spawnNpc(10, { x: 0, y: 0, plane: 0 })],
        entityRemoves: [eid(5)],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    expect(store.getEntity(10)).toBeDefined();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("actors.spawn");
    expect(eventTypes).toContain("objects.remove");
    expect(eventTypes).toContain("actors.remove");
    expect(eventTypes).toContain("groundItems.remove");
  });

  it("ingestTickDelta emits actor update events", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(
      fullStatePacket({
        tick: 1,
        selfEntityId: eid(1),
        entities: [spawnNpc(5, { x: 0, y: 0, plane: 0 })],
      }),
      0,
    );
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        entityUpdates: [
          {
            entityId: eid(5),
            mask: 0,
            changes: {
              position: { x: 1, y: 0, plane: 0 },
              facingTile: { x: 2, y: 0, plane: 0 },
            },
          },
        ],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("actors.updateTile");
    expect(eventTypes).toContain("actors.updateFacing");
  });

  it("ingestTickDelta emits hitsplat and notifyHit events", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        entityUpdates: [
          {
            entityId: eid(42),
            mask: 0,
            changes: {
              hitsplat: { amount: 5, type: "damage" },
            },
          },
        ],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("hitsplats.show");
    expect(eventTypes).toContain("actors.notifyHit");
  });

  it("ingestTickDelta emits xp drop events", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        xpDrops: [
          { skillId: "woodcutting", amount: 25 },
          { skillId: "mining", amount: 15 },
        ],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes.filter((t) => t === "xpDrops.show").length).toBe(2);
  });

  it("ingestTickDelta emits projectile events", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        projectiles: [
          {
            id: "proj-1",
            projectileId: "projectile_ember_flick",
            sourceEntityId: eid(42),
            targetEntityId: eid(7),
            startTile: { x: 1, y: 1, plane: 0 },
            endTile: { x: 3, y: 1, plane: 0 },
            startTick: 10,
            hitTick: 12,
          },
        ],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("projectiles.spawn");
  });

  it("ingestTickDelta applies UI deltas and chat", () => {
    const { ingestor, uiState } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const chat = [
      { text: "Hello", channel: "public" as const, entityId: eid(5), serverTime: 1000 },
    ];

    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        inventoryDeltas: [{ containerId: "inventory", changes: [] }],
        skillDelta: [{ skillId: "attack", level: 2, xp: 100, effectiveLevel: 2 }],
        varbitDelta: [{ varId: "flag", value: 1 }],
        chat,
        interfaceOpens: [
          {
            interfaceId: "dialogue",
            dialogue: {
              dialogueId: "dialogue_1",
              nodeId: "start",
              speakerName: "Baker",
              npcText: "Hello.",
              options: [{ index: 0, text: "Continue" }],
            },
          },
        ],
        interfaceCloses: [{ interfaceId: "dialogue" }],
      }),
      1,
      0,
    );

    expect(result).not.toBeNull();
    expect(uiState.chat.length).toBeGreaterThan(0);
    expect(uiState.skills.get("attack")?.level).toBe(2);
    expect(uiState.vars.get("flag")).toBe(1);
    expect(uiState.dialogue).toBeUndefined(); // opened then closed
  });

  it("does not emit chatOverhead for system messages", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        chat: [{ text: "System msg", channel: "system" as const, serverTime: 1000 }],
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const eventTypes = result!.presentationEvents.map((e) => e.type);
    expect(eventTypes).not.toContain("chatOverhead.show");
  });

  it("logs unknown entity kind instead of silently dropping", () => {
    const { ingestor, logDebug } = createTestSetup();
    ingestor.ingestFullState(
      fullStatePacket({
        entities: [
          {
            entityId: eid(1),
            kind: "unknown_kind",
            tile: { x: 0, y: 0, plane: 0 },
          } as unknown as EntitySpawnPacket,
        ],
      }),
      0,
    );
    expect(logDebug).toHaveBeenCalledWith("Unknown entity kind in spawn: unknown_kind");
  });

  it("records click tile and reports rejected move on empty self path", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    ingestor.recordClickTile({ x: 10, y: 20, plane: 0 }, 5);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 6,
        debug: { paths: [{ entityId: eid(42), path: [] }] },
      }),
      5,
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.rejectedMoves).toEqual([{ tile: { x: 10, y: 20, plane: 0 }, tick: 5 }]);
  });

  it("reports rejected move when no self path is present", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    ingestor.recordClickTile({ x: 5, y: 5, plane: 0 }, 5);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 6,
        debug: { paths: [{ entityId: eid(99), path: [{ x: 0, y: 0, plane: 0 }] }] },
      }),
      5,
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.rejectedMoves).toEqual([{ tile: { x: 5, y: 5, plane: 0 }, tick: 5 }]);
  });

  it("does not report rejected move when click is too old", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    ingestor.recordClickTile({ x: 5, y: 5, plane: 0 }, 1);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 6,
        debug: { paths: [{ entityId: eid(42), path: [] }] },
      }),
      5,
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.rejectedMoves).toEqual([]);
  });

  it("emits debug path tiles for self entity", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(42) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        debug: {
          paths: [
            {
              entityId: eid(42),
              path: [
                { x: 1, y: 0, plane: 0 },
                { x: 2, y: 0, plane: 0 },
              ],
            },
          ],
        },
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const debugEvents = result!.debugEvents;
    const pathEvents = debugEvents.filter((e) => e.type === "debug.markPathTile");
    expect(pathEvents.length).toBe(2);
  });

  it("emits all debug overlay events", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        debug: {
          trueTiles: [{ entityId: eid(1), tile: { x: 0, y: 0, plane: 0 } }],
          collisionTiles: [{ x: 1, y: 1, plane: 0 }],
          footprints: [{ x: 2, y: 2, plane: 0 }],
          reachTiles: [{ center: { x: 3, y: 3, plane: 0 }, radius: 2 }],
          loSRays: [{ start: { x: 0, y: 0, plane: 0 }, end: { x: 1, y: 1, plane: 0 } }],
          actionQueue: ["move", "attack"],
          combatCooldown: 3,
          pendingHits: [{ targetId: eid(5), amount: 10 }],
          npcLeash: { x: 4, y: 4, plane: 0 },
          varbits: [{ varId: "q1", value: 1 }],
        },
      }),
      1,
      0,
    );
    expect(result).not.toBeNull();
    const debugEvents = result!.debugEvents;
    const types = debugEvents.map((e) => e.type);
    expect(types).toContain("debug.markTrueTile");
    expect(types).toContain("debug.markCollisionTile");
    expect(types).toContain("debug.markFootprint");
    expect(types).toContain("debug.markReachTiles");
    expect(types).toContain("debug.markLoSRay");
    expect(types).toContain("debug.setActionQueue");
    expect(types).toContain("debug.setCombatCooldown");
    expect(types).toContain("debug.setPendingHits");
    expect(types).toContain("debug.setNpcLeash");
    expect(types).toContain("debug.setVarbits");
  });

  it("applies recipeLists from tick delta", () => {
    const { ingestor, uiState } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const recipeList = {
      interfaceId: "recipe",
      stationEntityId: 5,
      stationName: "Range",
      recipes: [],
    };

    ingestor.ingestTickDelta(tickDeltaPacket({ tick: 2, recipeLists: [recipeList] }), 1, 0);
    expect(uiState.recipeList).toEqual(recipeList);
  });

  it("applies recipeResults from tick delta", () => {
    const { ingestor, uiState } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const results = [
      { recipeId: "r1", success: true, xpReward: 10 },
      { recipeId: "r2", success: false, message: "Failed" },
    ];

    ingestor.ingestTickDelta(tickDeltaPacket({ tick: 2, recipeResults: results }), 1, 0);
    expect(uiState.recipeResult).toEqual(results[results.length - 1]);
  });

  it("opens recipe via interfaceOpens", () => {
    const { ingestor, uiState } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    const recipeList = {
      interfaceId: "recipe",
      stationEntityId: 7,
      stationName: "Furnace",
      recipes: [],
    };

    ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        interfaceOpens: [{ interfaceId: "recipe", recipe: recipeList }],
      }),
      1,
      0,
    );
    expect(uiState.recipeList).toEqual(recipeList);
  });

  it("closes recipe via interfaceCloses", () => {
    const { ingestor, uiState } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }), 0);
    ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        interfaceCloses: [{ interfaceId: "recipe" }],
      }),
      1,
      0,
    );
    expect(uiState.recipeList).toBeUndefined();
  });

  it("syncs RenderClock on full state ingestion", () => {
    const { ingestor, renderClock } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 10, serverTime: 5000 }), 1000);
    expect(renderClock.lastSyncTick).toBe(10);
  });

  it("syncs RenderClock on tick delta ingestion", () => {
    const { ingestor, renderClock } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1, serverTime: 1000 }), 0);
    ingestor.ingestTickDelta(tickDeltaPacket({ tick: 2, serverTime: 1600 }), 1, 600);
    expect(renderClock.lastSyncTick).toBe(2);
  });

  it("ingestTickDelta returns null for duplicate tick", () => {
    const { ingestor, snapshotBuffer } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1 }), 0);
    const first = ingestor.ingestTickDelta(tickDeltaPacket({ tick: 2 }), 1, 0);
    expect(first).not.toBeNull();
    const second = ingestor.ingestTickDelta(tickDeltaPacket({ tick: 2 }), 1, 0);
    expect(second).toBeNull();
    expect(snapshotBuffer.depth).toBe(2);
  });

  it("ingestTickDelta inserts snapshot into buffer", () => {
    const { ingestor, snapshotBuffer } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1 }), 0);
    ingestor.ingestTickDelta(tickDeltaPacket({ tick: 2 }), 1, 0);
    expect(snapshotBuffer.depth).toBe(2);
  });

  it("ingestFullState snapshot contains regionLoads", () => {
    const { ingestor } = createTestSetup();
    const result = ingestor.ingestFullState(
      fullStatePacket({
        tick: 1,
        regionLoads: [{ regionId: rid("r1"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
      }),
      0,
    );
    expect(result.snapshot.regionLoads.length).toBe(1);
    expect(result.snapshot.regionUnloads.length).toBe(0);
  });

  it("ingestTickDelta snapshot contains region loads and unloads", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(fullStatePacket({ tick: 1 }), 0);
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        regionLoads: [{ regionId: rid("r1"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
        regionUnloads: [{ regionId: rid("r0") }],
      }),
      1,
      0,
    );
    expect(result!.snapshot.regionLoads.length).toBe(1);
    expect(result!.snapshot.regionUnloads.length).toBe(1);
  });

  it("ingestTickDelta snapshot contains updated entities", () => {
    const { ingestor } = createTestSetup();
    ingestor.ingestFullState(
      fullStatePacket({ tick: 1, entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
      0,
    );
    const result = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        entityUpdates: [
          {
            entityId: eid(1),
            mask: 0,
            changes: { position: { x: 1, y: 0, plane: 0 } },
          },
        ],
      }),
      1,
      0,
    );
    expect(result!.snapshot.entities.length).toBe(1);
    expect(result!.snapshot.entities[0]!.tile).toEqual({ x: 1, y: 0, plane: 0 });
  });

  it("ingestTickDelta handles death and respawn notices", () => {
    const { ingestor, uiState, store } = createTestSetup();
    ingestor.ingestFullState(
      fullStatePacket({ tick: 1, entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
      0,
    );
    const deathResult = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 2,
        deathNotices: [{ entityId: eid(1) }],
      }),
      1,
      0,
    );
    expect(uiState.deathScreen).toBe(true);
    expect(store.getEntity(1)!.hidden).toBe(true);
    const deathEventTypes = deathResult!.presentationEvents.map((e) => e.type);
    expect(deathEventTypes).toContain("actors.hide");

    const respawnResult = ingestor.ingestTickDelta(
      tickDeltaPacket({
        tick: 3,
        respawnNotices: [{ entityId: eid(1), tile: { x: 10, y: 10, plane: 0 } }],
      }),
      2,
      0,
    );
    expect(uiState.deathScreen).toBe(false);
    expect(store.getEntity(1)!.hidden).toBe(false);
    expect(store.getEntity(1)!.tile).toEqual({ x: 10, y: 10, plane: 0 });
    const respawnEventTypes = respawnResult!.presentationEvents.map((e) => e.type);
    expect(respawnEventTypes).toContain("actors.show");
    expect(respawnEventTypes).toContain("actors.updateTile");
  });
});

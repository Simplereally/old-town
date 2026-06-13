import {
  type EntityId,
  type EntityKind,
  type EntitySpawnPacket,
  entityId,
  type FullStatePacket,
  type RegionId,
  ServerPacketType,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { UIState } from "../ui/UIState";
import { ClientPacketApplier, type PurePacketApplierContext } from "./ClientPacketApplier";
import { ClientWorldStore } from "./ClientWorldStore";
import { SnapshotBuffer } from "./SnapshotBuffer";

function eid(value: number): EntityId {
  return entityId(value);
}

function rid(value: string): RegionId {
  return value as RegionId;
}

function createMockContext(): PurePacketApplierContext {
  const store = new ClientWorldStore();
  const snapshotBuffer = new SnapshotBuffer({
    tickMs: 600,
    interpolationDelayMs: 600,
    maxSnapshots: 32,
    freezeAfterMissingTicks: 2,
    snapAfterMissingTicks: 6,
  });
  const uiState = new UIState();

  return {
    store,
    snapshotBuffer,
    uiState,
    logDebug: vi.fn(),
    tileSizeWorldUnits: 1,
  };
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

describe("ClientPacketApplier (pure)", () => {
  it("applyFullState clears store before spawning", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(
      fullStatePacket({ entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
    );

    expect(ctx.store.getEntity(1)).toBeDefined();
    expect(ctx.store.getAllEntities().length).toBe(1);
  });

  it("applyFullState resets snapshot buffer", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(
      fullStatePacket({ tick: 10, entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
    );

    expect(ctx.snapshotBuffer.latestAcceptedTick).toBe(10);
    expect(ctx.snapshotBuffer.depth).toBe(1);
  });

  it("applyFullState sets selfEntityId from packet", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(fullStatePacket({ selfEntityId: eid(99) }));
    expect(applier.selfEntityId).toBe(99);
  });

  it("applyFullState emits region load events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const chunk = { cx: 0, cy: 0, tiles: [] };

    const result = applier.applyFullState(
      fullStatePacket({ regionLoads: [{ regionId: rid("r1"), chunks: [chunk] }] }),
    );

    const loadEvents = result.presentationEvents.filter((e) => e.type === "region.load");
    expect(loadEvents.length).toBe(1);
    expect(loadEvents[0]?.payload).toEqual({ regionId: rid("r1"), chunks: [chunk] });
  });

  it("applyFullState emits player spawn event with self flag", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const player = spawnPlayer(42, { x: 5, y: 5, plane: 0 });

    const result = applier.applyFullState(
      fullStatePacket({ selfEntityId: eid(42), entities: [player] }),
    );

    const spawnEvent = result.presentationEvents.find((e) => e.type === "actors.spawn");
    expect(spawnEvent).toBeDefined();
    expect(spawnEvent?.payload).toMatchObject({
      entityId: eid(42),
      tile: { x: 5, y: 5, plane: 0 },
      isLocalPlayer: true,
      kind: "player",
    });

    const appearanceEvent = result.presentationEvents.find(
      (e) => e.type === "actors.updateAppearance",
    );
    expect(appearanceEvent).toBeDefined();
    expect(appearanceEvent?.payload).toEqual({
      entityId: eid(42),
      appearance: { name: "Hero", bodyId: "dev" },
    });
  });

  it("applyFullState emits npc, object, and ground_item spawn events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    const result = applier.applyFullState(
      fullStatePacket({
        entities: [
          spawnNpc(1, { x: 1, y: 1, plane: 0 }, "guard"),
          spawnObject(2, { x: 2, y: 2, plane: 0 }, "rock"),
          spawnGroundItem(3, { x: 3, y: 3, plane: 0 }, "sword", 1),
        ],
      }),
    );

    const eventTypes = result.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("actors.spawn");
    expect(eventTypes).toContain("objects.spawn");
    expect(eventTypes).toContain("groundItems.spawn");
  });

  it("applyFullState stores npc, object, and ground_item in world store", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(
      fullStatePacket({
        entities: [
          spawnNpc(1, { x: 1, y: 1, plane: 0 }, "guard"),
          spawnObject(2, { x: 2, y: 2, plane: 0 }, "rock"),
          spawnGroundItem(3, { x: 3, y: 3, plane: 0 }, "sword", 1),
        ],
      }),
    );

    expect(ctx.store.getEntity(1)?.kind).toBe("npc");
    expect(ctx.store.getEntity(2)?.kind).toBe("object");
    expect(ctx.store.getEntity(3)?.kind).toBe("groundItem");
  });

  it("applyFullState sets inventory, equipment, skills, and vars", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const inventory = {
      containerId: "inventory",
      changes: [{ slot: 0, itemId: "coin", quantity: 5 }],
    };
    const skills = [{ skillId: "attack", level: 1, xp: 0, effectiveLevel: 1 }];
    const vars = [{ varId: "quest", value: 1 }];
    const equipment = { slots: ["helm", null, "amulet"] };

    applier.applyFullState(fullStatePacket({ inventory, equipment, skills, vars }));

    expect(ctx.uiState.inventory.get(0)?.itemId).toBe("coin");
    expect(ctx.uiState.equipment.get(0)).toBe("helm");
    expect(ctx.uiState.skills.get("attack")?.level).toBe(1);
    expect(ctx.uiState.vars.get("quest")).toBe(1);
  });

  it("applyFullState returns tick, serverTime, and selfEntityId", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    const result = applier.applyFullState(
      fullStatePacket({ tick: 10, serverTime: 5000, selfEntityId: eid(7) }),
    );

    expect(result.tick).toBe(10);
    expect(result.serverTime).toBe(5000);
    expect(result.selfEntityId).toBe(7);
    expect(result.rejectedMoves).toEqual([]);
  });

  it("applyTickDelta uses selfEntityId from previous full state", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));
    const result = applier.applyTickDelta(tickDeltaPacket(), 1);

    expect(result?.selfEntityId).toBe(42);
  });

  it("applyTickDelta emits region unloads and loads", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const chunk = { cx: 0, cy: 0, tiles: [] };

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        regionUnloads: [{ regionId: rid("old") }],
        regionLoads: [{ regionId: rid("new"), chunks: [chunk] }],
      }),
      1,
    );

    const eventTypes = result?.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("region.unload");
    expect(eventTypes).toContain("region.load");
  });

  it("applyTickDelta emits add and remove events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        entityAdds: [spawnNpc(10, { x: 0, y: 0, plane: 0 })],
        entityRemoves: [eid(5)],
      }),
      1,
    );

    const eventTypes = result?.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("actors.spawn");
    expect(eventTypes).toContain("objects.remove");
    expect(eventTypes).toContain("actors.remove");
    expect(eventTypes).toContain("groundItems.remove");
  });

  it("applyTickDelta updates store on entity add and remove", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    applier.applyTickDelta(
      tickDeltaPacket({
        entityAdds: [spawnNpc(10, { x: 0, y: 0, plane: 0 })],
        entityRemoves: [eid(5)],
      }),
      1,
    );

    expect(ctx.store.getEntity(10)).toBeDefined();
    expect(ctx.store.getEntity(10)?.kind).toBe("npc");
  });

  it("applyTickDelta emits actor position and facing events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(
      fullStatePacket({ selfEntityId: eid(1), entities: [spawnNpc(5, { x: 0, y: 0, plane: 0 })] }),
    );

    const result = applier.applyTickDelta(
      tickDeltaPacket({
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
    );

    const eventTypes = result?.presentationEvents.map((e) => e.type);
    expect(ctx.store.getEntity(5)).toBeDefined();
    expect(eventTypes).toContain("actors.updateTile");
    expect(eventTypes).toContain("actors.updateFacing");
  });

  it("applyTickDelta updates store on position change", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(
      fullStatePacket({ selfEntityId: eid(1), entities: [spawnNpc(5, { x: 0, y: 0, plane: 0 })] }),
    );

    applier.applyTickDelta(
      tickDeltaPacket({
        entityUpdates: [
          {
            entityId: eid(5),
            mask: 0,
            changes: {
              position: { x: 1, y: 0, plane: 0 },
            },
          },
        ],
      }),
      1,
    );

    const entity = ctx.store.getEntity(5);
    expect(entity).toBeDefined();
    expect(entity?.tile).toEqual({ x: 1, y: 0, plane: 0 });
    expect(entity?.previousTile).toEqual({ x: 0, y: 0, plane: 0 });
  });

  it("applyTickDelta emits object transform event", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        entityUpdates: [
          {
            entityId: eid(5),
            mask: 0,
            changes: { transform: "dry_tree_depleted" },
          },
        ],
      }),
      1,
    );

    const event = result?.presentationEvents.find((e) => e.type === "objects.transform");
    expect(event).toBeDefined();
    expect(event?.payload).toEqual({ entityId: eid(5), defId: "dry_tree_depleted" });
  });

  it("applyTickDelta emits hitsplats and syncs equipment for self", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        entityUpdates: [
          {
            entityId: eid(42),
            mask: 0,
            changes: {
              hitsplat: { amount: 5, type: "damage" },
              equipment: { slots: ["helm"] },
            },
          },
        ],
      }),
      1,
    );

    const eventTypes = result?.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("hitsplats.show");
    expect(eventTypes).toContain("actors.notifyHit");
    expect(ctx.uiState.equipment.get(0)).toBe("helm");
  });

  it("applyTickDelta emits XP drop events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        xpDrops: [
          { skillId: "woodcutting", amount: 25 },
          { skillId: "mining", amount: 15 },
        ],
      }),
      1,
    );

    expect(result).not.toBeNull();
    if (!result) throw new Error("unexpected null");
    const xpEvents = result.presentationEvents.filter((e) => e.type === "xpDrops.show");
    expect(xpEvents.length).toBe(2);
  });

  it("applyFullState emits xpDrops.clear event", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    const result = applier.applyFullState(
      fullStatePacket({ entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
    );

    const eventTypes = result.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("xpDrops.clear");
  });

  it("applyTickDelta emits projectile events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
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
    );

    const event = result?.presentationEvents.find((e) => e.type === "projectiles.spawn");
    expect(event).toBeDefined();
    expect(event?.payload).toEqual({
      id: "proj-1",
      startTile: { x: 1, y: 1, plane: 0 },
      endTile: { x: 3, y: 1, plane: 0 },
      startTick: 10,
      hitTick: 12,
    });
  });

  it("applyTickDelta emits health bar update events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        entityUpdates: [
          {
            entityId: eid(7),
            mask: 0,
            changes: { healthBar: { current: 3, max: 10 } },
          },
        ],
      }),
      1,
    );

    const event = result?.presentationEvents.find((e) => e.type === "actors.updateHealthBar");
    expect(event).toBeDefined();
    expect(event?.payload).toEqual({ entityId: eid(7), health: 3, maxHealth: 10 });
  });

  it("applyTickDelta ignores equipment for non-self entity", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.applyTickDelta(
      tickDeltaPacket({
        entityUpdates: [
          {
            entityId: eid(99),
            mask: 0,
            changes: {
              equipment: { slots: ["helm"] },
            },
          },
        ],
      }),
      1,
    );

    expect(ctx.uiState.equipment.size).toBe(0);
  });

  it("applyTickDelta applies UI deltas and chat", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const chat = [
      { text: "Hello", channel: "public" as const, entityId: eid(5), serverTime: 1000 },
    ];

    const result = applier.applyTickDelta(
      tickDeltaPacket({
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
    );

    expect(ctx.uiState.chat.length).toBeGreaterThan(0);
    expect(ctx.uiState.skills.get("attack")?.level).toBe(2);
    expect(ctx.uiState.vars.get("flag")).toBe(1);
    expect(ctx.uiState.dialogue).toBeUndefined();

    const eventTypes = result?.presentationEvents.map((e) => e.type);
    expect(eventTypes).toContain("chatOverhead.show");
  });

  it("does not emit chatOverhead for system messages", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        chat: [{ text: "System msg", channel: "system" as const, serverTime: 1000 }],
      }),
      1,
    );

    const eventTypes = result?.presentationEvents.map((e) => e.type);
    expect(eventTypes).not.toContain("chatOverhead.show");
  });

  it("logs unknown entity kind instead of silently dropping", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(
      fullStatePacket({
        entities: [
          {
            entityId: eid(1),
            kind: "unknown_kind" as unknown as EntityKind,
            tile: { x: 0, y: 0, plane: 0 },
          },
        ],
      }),
    );

    expect(ctx.logDebug).toHaveBeenCalledWith("Unknown entity kind in spawn: unknown_kind");
  });

  it("records click tile and reports rejected move on empty self path", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.recordClickTile({ x: 10, y: 20, plane: 0 }, 5);
    const result = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 6,
        debug: { paths: [{ entityId: eid(42), path: [] }] },
      }),
      5,
    );

    expect(ctx.logDebug).toHaveBeenCalledWith("Move rejected: no path to (10, 20)");
    expect(result?.rejectedMoves).toEqual([{ tile: { x: 10, y: 20, plane: 0 }, tick: 5 }]);
  });

  it("reports rejected move when no self path is present", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.recordClickTile({ x: 5, y: 5, plane: 0 }, 5);
    const result = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 6,
        debug: { paths: [{ entityId: eid(99), path: [{ x: 0, y: 0, plane: 0 }] }] },
      }),
      5,
    );

    expect(ctx.logDebug).toHaveBeenCalledWith("Move rejected: no path to (5, 5)");
    expect(result?.rejectedMoves).toEqual([{ tile: { x: 5, y: 5, plane: 0 }, tick: 5 }]);
  });

  it("does not report rejected move when click is too old", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.recordClickTile({ x: 5, y: 5, plane: 0 }, 1);
    const result = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 6,
        debug: { paths: [{ entityId: eid(42), path: [] }] },
      }),
      5,
    );

    expect(result?.rejectedMoves).toEqual([]);
  });

  it("emits debug path tiles for self entity", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
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
    );

    expect(result).not.toBeNull();
    if (!result) throw new Error("unexpected null");
    const debugEvents = result.debugEvents.filter((e) => e.type === "debug.markPathTile");
    expect(debugEvents.length).toBe(2);
  });

  it("emits all debug overlay events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
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
    );

    expect(result).not.toBeNull();
    if (!result) throw new Error("unexpected null");
    const debugEvents = result.debugEvents;
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
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const recipeList = {
      interfaceId: "recipe",
      stationEntityId: 5,
      stationName: "Range",
      recipes: [],
    };

    applier.applyTickDelta(tickDeltaPacket({ recipeLists: [recipeList] }), 1);
    expect(ctx.uiState.recipeList).toEqual(recipeList);
  });

  it("applies recipeResults from tick delta", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const results = [
      { recipeId: "r1", success: true, xpReward: 10 },
      { recipeId: "r2", success: false, message: "Failed" },
    ];

    applier.applyTickDelta(tickDeltaPacket({ recipeResults: results }), 1);
    expect(ctx.uiState.recipeResult).toEqual(results[results.length - 1]);
  });

  it("opens recipe via interfaceOpens", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const recipeList = {
      interfaceId: "recipe",
      stationEntityId: 7,
      stationName: "Furnace",
      recipes: [],
    };

    applier.applyTickDelta(
      tickDeltaPacket({
        interfaceOpens: [{ interfaceId: "recipe", recipe: recipeList }],
      }),
      1,
    );
    expect(ctx.uiState.recipeList).toEqual(recipeList);
  });

  it("closes recipe via interfaceCloses", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    applier.applyTickDelta(
      tickDeltaPacket({
        interfaceCloses: [{ interfaceId: "recipe" }],
      }),
      1,
    );
    expect(ctx.uiState.recipeList).toBeUndefined();
  });

  it("applyTickDelta inserts snapshot into buffer", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ tick: 1 }));

    applier.applyTickDelta(tickDeltaPacket({ tick: 2 }), 1);
    expect(ctx.snapshotBuffer.depth).toBe(2);
  });

  it("applyTickDelta snapshot contains entities from store", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(
      fullStatePacket({ tick: 1, entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
    );

    const result = applier.applyTickDelta(
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
    );

    expect(result?.snapshot.entities.length).toBe(1);
    expect(result?.snapshot.entities[0]?.tile).toEqual({ x: 1, y: 0, plane: 0 });
  });

  it("applyTickDelta returns null for stale tick", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ tick: 5 }));

    const result = applier.applyTickDelta(tickDeltaPacket({ tick: 4 }), 5);
    expect(result).toBeNull();
  });

  it("applyTickDelta returns null for duplicate tick", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ tick: 1 }));

    applier.applyTickDelta(tickDeltaPacket({ tick: 2 }), 1);
    const result = applier.applyTickDelta(tickDeltaPacket({ tick: 2 }), 1);
    expect(result).toBeNull();
  });

  it("applyFullState snapshot contains regionLoads", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    const result = applier.applyFullState(
      fullStatePacket({
        tick: 1,
        regionLoads: [{ regionId: rid("r1"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
      }),
    );

    expect(result.snapshot.regionLoads.length).toBe(1);
    expect(result.snapshot.regionUnloads.length).toBe(0);
  });

  it("applyTickDelta snapshot contains regionLoads and regionUnloads", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ tick: 1 }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 2,
        regionLoads: [{ regionId: rid("r1"), chunks: [{ cx: 0, cy: 0, tiles: [] }] }],
        regionUnloads: [{ regionId: rid("r0") }],
      }),
      1,
    );

    expect(result?.snapshot.regionLoads.length).toBe(1);
    expect(result?.snapshot.regionUnloads.length).toBe(1);
  });

  it("applyTickDelta handles death and respawn notices", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(
      fullStatePacket({ tick: 1, entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
    );

    const deathResult = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 2,
        deathNotices: [{ entityId: eid(1) }],
      }),
      1,
    );
    expect(ctx.uiState.deathScreen).toBe(true);
    expect(ctx.store.getEntity(1)?.hidden).toBe(true);
    const deathEventTypes = deathResult?.presentationEvents.map((e) => e.type);
    expect(deathEventTypes).toContain("actors.hide");

    const respawnResult = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 3,
        respawnNotices: [{ entityId: eid(1), tile: { x: 10, y: 10, plane: 0 } }],
      }),
      2,
    );
    expect(ctx.uiState.deathScreen).toBe(false);
    expect(ctx.store.getEntity(1)?.hidden).toBe(false);
    expect(ctx.store.getEntity(1)?.tile).toEqual({ x: 10, y: 10, plane: 0 });
    const respawnEventTypes = respawnResult?.presentationEvents.map((e) => e.type);
    expect(respawnEventTypes).toContain("actors.show");
    expect(respawnEventTypes).toContain("actors.updateTile");
  });

  it("applyTickDelta emits events in correct order", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ tick: 1, selfEntityId: eid(1) }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        tick: 2,
        entityAdds: [spawnNpc(10, { x: 0, y: 0, plane: 0 })],
        entityUpdates: [
          {
            entityId: eid(10),
            mask: 0,
            changes: {
              position: { x: 1, y: 0, plane: 0 },
            },
          },
        ],
      }),
      1,
    );

    expect(result).not.toBeNull();
    if (!result) throw new Error("unexpected null");
    const eventTypes = result.presentationEvents.map((e) => e.type);
    const spawnIndex = eventTypes.indexOf("actors.spawn");
    const updateIndex = eventTypes.indexOf("actors.updateTile");
    expect(spawnIndex).toBeLessThan(updateIndex);
  });

  it("applyFullState emits clear events before spawn events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    const result = applier.applyFullState(
      fullStatePacket({
        entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })],
      }),
    );

    const eventTypes = result.presentationEvents.map((e) => e.type);
    const clearIndex = eventTypes.indexOf("actors.clear");
    const spawnIndex = eventTypes.indexOf("actors.spawn");
    expect(clearIndex).toBeLessThan(spawnIndex);
  });
});

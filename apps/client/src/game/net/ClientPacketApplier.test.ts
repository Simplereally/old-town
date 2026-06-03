import {
  Direction,
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
import { Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";
import { ClientPacketApplier, type PacketApplierContext } from "./ClientPacketApplier";

function eid(value: number): EntityId {
  return entityId(value);
}

function rid(value: string): RegionId {
  return value as RegionId;
}

function createMockContext(): PacketApplierContext {
  return {
    terrain: {
      loadChunk: vi.fn(),
      unloadRegion: vi.fn(),
    },
    objects: {
      clear: vi.fn(),
      spawn: vi.fn(),
      remove: vi.fn(),
      transform: vi.fn(),
    },
    actors: {
      clear: vi.fn(),
      spawn: vi.fn(),
      remove: vi.fn(),
      updateTile: vi.fn(),
      updateFacing: vi.fn(),
      updateHealthBar: vi.fn(),
      notifyHit: vi.fn(),
      updateAppearance: vi.fn(),
      getActorState: vi.fn(),
    },
    groundItems: {
      clear: vi.fn(),
      spawn: vi.fn(),
      remove: vi.fn(),
    },
    hitsplats: {
      clear: vi.fn(),
      show: vi.fn(),
      update: vi.fn(),
    },
    xpDrops: {
      clear: vi.fn(),
      show: vi.fn(),
      update: vi.fn(),
    },
    projectiles: {
      clear: vi.fn(),
      spawn: vi.fn(),
    },
    chatOverhead: {
      clear: vi.fn(),
      show: vi.fn(),
    },
    debug: {
      clear: vi.fn(),
      markPathTile: vi.fn(),
      markTrueTile: vi.fn(),
      markCollisionTile: vi.fn(),
      markFootprint: vi.fn(),
      markReachTiles: vi.fn(),
      markLoSRay: vi.fn(),
      setActionQueue: vi.fn(),
      setCombatCooldown: vi.fn(),
      setPendingHits: vi.fn(),
      setNpcLeash: vi.fn(),
      setVarbits: vi.fn(),
    },
    uiState: {
      setInventory: vi.fn(),
      setSkills: vi.fn(),
      setVars: vi.fn(),
      setEquipment: vi.fn(),
      applyInventoryDelta: vi.fn(),
      applySkillDelta: vi.fn(),
      applyVarbitDelta: vi.fn(),
      addChat: vi.fn(),
      setDialogue: vi.fn(),
      clearDialogue: vi.fn(),
      setBank: vi.fn(),
      applyBankDelta: vi.fn(),
      clearBank: vi.fn(),
      setShop: vi.fn(),
      clearShop: vi.fn(),
    },
    selfEntityId: 0,
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

describe("ClientPacketApplier", () => {
  it("applyFullState clears all layers before spawning", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(
      fullStatePacket({ entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }),
    );

    expect(vi.mocked(ctx.actors.clear)).toHaveBeenCalledBefore(vi.mocked(ctx.actors.spawn));
    expect(ctx.objects.clear).toHaveBeenCalled();
    expect(ctx.groundItems.clear).toHaveBeenCalled();
    expect(ctx.hitsplats.clear).toHaveBeenCalled();
    expect(ctx.chatOverhead.clear).toHaveBeenCalled();
    expect(ctx.debug?.clear).toHaveBeenCalled();
  });

  it("applyFullState sets selfEntityId from packet", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(fullStatePacket({ selfEntityId: eid(99) }));
    expect(applier.selfEntityId).toBe(99);
  });

  it("applyFullState loads terrain chunks", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const chunk = { cx: 0, cy: 0, tiles: [] };

    applier.applyFullState(
      fullStatePacket({ regionLoads: [{ regionId: rid("r1"), chunks: [chunk] }] }),
    );

    expect(ctx.terrain.loadChunk).toHaveBeenCalledWith(rid("r1"), chunk);
  });

  it("applyFullState spawns player with self flag", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const player = spawnPlayer(42, { x: 5, y: 5, plane: 0 });

    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42), entities: [player] }));

    expect(ctx.actors.spawn).toHaveBeenCalledWith(
      eid(42),
      { x: 5, y: 5, plane: 0 },
      undefined,
      true,
      "player",
    );
    expect(ctx.actors.updateAppearance).toHaveBeenCalledWith(eid(42), {
      name: "Hero",
      bodyId: "dev",
    });
  });

  it("applyFullState spawns npc, object, and ground_item", () => {
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

    expect(ctx.actors.spawn).toHaveBeenCalledWith(
      eid(1),
      { x: 1, y: 1, plane: 0 },
      "guard",
      false,
      "npc",
    );
    expect(ctx.objects.spawn).toHaveBeenCalledWith(eid(2), { x: 2, y: 2, plane: 0 }, "rock");
    expect(ctx.groundItems.spawn).toHaveBeenCalledWith(
      eid(3),
      { x: 3, y: 3, plane: 0 },
      "sword",
      1,
    );
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

    expect(ctx.uiState.setInventory).toHaveBeenCalledWith(inventory);
    expect(ctx.uiState.setEquipment).toHaveBeenCalledWith(equipment.slots);
    expect(ctx.uiState.setSkills).toHaveBeenCalledWith(skills);
    expect(ctx.uiState.setVars).toHaveBeenCalledWith(vars);
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

    expect(result.selfEntityId).toBe(42);
  });

  it("applyTickDelta unloads and loads terrain regions", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    const chunk = { cx: 0, cy: 0, tiles: [] };

    applier.applyTickDelta(
      tickDeltaPacket({
        regionUnloads: [{ regionId: rid("old") }],
        regionLoads: [{ regionId: rid("new"), chunks: [chunk] }],
      }),
      1,
    );

    expect(ctx.terrain.unloadRegion).toHaveBeenCalledWith(rid("old"));
    expect(ctx.terrain.loadChunk).toHaveBeenCalledWith(rid("new"), chunk);
  });

  it("applyTickDelta adds and removes entities", () => {
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

    expect(ctx.actors.spawn).toHaveBeenCalledWith(
      eid(10),
      { x: 0, y: 0, plane: 0 },
      "goblin",
      false,
      "npc",
    );
    expect(ctx.objects.remove).toHaveBeenCalledWith(eid(5));
    expect(ctx.actors.remove).toHaveBeenCalledWith(eid(5));
    expect(ctx.groundItems.remove).toHaveBeenCalledWith(eid(5));
  });

  it("applyTickDelta updates actor position and facing", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    vi.mocked(ctx.actors.getActorState).mockReturnValue({
      serverTile: { x: 0, y: 0, plane: 0 },
      visualPosition: new Vector3(0, 0, 0),
    });

    applier.applyTickDelta(
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

    expect(ctx.actors.updateTile).toHaveBeenCalledWith(eid(5), { x: 1, y: 0, plane: 0 });
    expect(ctx.actors.updateFacing).toHaveBeenCalledWith(eid(5), Direction.East);
  });

  it("applyTickDelta transforms object definitions", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    applier.applyTickDelta(
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

    expect(ctx.objects.transform).toHaveBeenCalledWith(eid(5), "dry_tree_depleted");
  });

  it("applyTickDelta shows hitsplats and syncs equipment for self", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.applyTickDelta(
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

    expect(ctx.hitsplats.show).toHaveBeenCalledWith(eid(42), 5, "damage", 1);
    expect(ctx.uiState.setEquipment).toHaveBeenCalledWith(["helm"]);
  });

  it("applyTickDelta shows XP drops for self", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.applyTickDelta(
      tickDeltaPacket({
        xpDrops: [
          { skillId: "woodcutting", amount: 25 },
          { skillId: "mining", amount: 15 },
        ],
      }),
      1,
    );

    expect(ctx.xpDrops.show).toHaveBeenCalledWith(eid(42), "woodcutting", 25, 1);
    expect(ctx.xpDrops.show).toHaveBeenCalledWith(eid(42), "mining", 15, 1);
  });

  it("applyFullState clears xp drops", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);

    applier.applyFullState(fullStatePacket({ entities: [spawnPlayer(1, { x: 0, y: 0, plane: 0 })] }));

    expect(ctx.xpDrops.clear).toHaveBeenCalled();
  });

  it("applyTickDelta spawns projectile visual events", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.applyTickDelta(
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

    expect(ctx.projectiles.spawn).toHaveBeenCalledWith(
      "proj-1",
      { x: 1, y: 1, plane: 0 },
      { x: 3, y: 1, plane: 0 },
      2,
    );
  });

  it("applyTickDelta updates actor health bars", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.applyTickDelta(
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

    expect(ctx.actors.updateHealthBar).toHaveBeenCalledWith(eid(7), 3, 10);
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

    expect(ctx.uiState.setEquipment).not.toHaveBeenCalled();
  });

  it("applyTickDelta applies UI deltas and chat", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    const chat = [
      { text: "Hello", channel: "public" as const, entityId: eid(5), serverTime: 1000 },
    ];
    vi.mocked(ctx.actors.getActorState).mockReturnValue({
      serverTile: { x: 0, y: 0, plane: 0 },
      visualPosition: new Vector3(0, 0, 0),
    });

    applier.applyTickDelta(
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

    expect(ctx.uiState.applyInventoryDelta).toHaveBeenCalled();
    expect(ctx.uiState.applySkillDelta).toHaveBeenCalledWith([
      { skillId: "attack", level: 2, xp: 100, effectiveLevel: 2 },
    ]);
    expect(ctx.uiState.applyVarbitDelta).toHaveBeenCalledWith([{ varId: "flag", value: 1 }]);
    expect(ctx.uiState.addChat).toHaveBeenCalledWith(chat);
    expect(ctx.chatOverhead.show).toHaveBeenCalledWith(eid(5), "Hello", new Vector3(0, 0, 0));
    expect(ctx.uiState.setDialogue).toHaveBeenCalledWith({
      dialogueId: "dialogue_1",
      nodeId: "start",
      speakerName: "Baker",
      npcText: "Hello.",
      options: [{ index: 0, text: "Continue" }],
    });
    expect(ctx.uiState.clearDialogue).toHaveBeenCalled();
  });

  it("does not show chat overhead for system messages", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    applier.applyTickDelta(
      tickDeltaPacket({
        chat: [{ text: "System msg", channel: "system" as const, serverTime: 1000 }],
      }),
      1,
    );

    expect(ctx.chatOverhead.show).not.toHaveBeenCalled();
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
        debug: { paths: [{ entityId: eid(42), path: [] }] },
      }),
      6,
    );

    expect(ctx.logDebug).toHaveBeenCalledWith("Move rejected: no path to (10, 20)");
    expect(result.rejectedMoves).toEqual([{ tile: { x: 10, y: 20, plane: 0 }, tick: 5 }]);
  });

  it("reports rejected move when no self path is present", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.recordClickTile({ x: 5, y: 5, plane: 0 }, 5);
    const result = applier.applyTickDelta(
      tickDeltaPacket({
        debug: { paths: [{ entityId: eid(99), path: [{ x: 0, y: 0, plane: 0 }] }] },
      }),
      6,
    );

    expect(ctx.logDebug).toHaveBeenCalledWith("Move rejected: no path to (5, 5)");
    expect(result.rejectedMoves).toEqual([{ tile: { x: 5, y: 5, plane: 0 }, tick: 5 }]);
  });

  it("does not report rejected move when click is too old", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.recordClickTile({ x: 5, y: 5, plane: 0 }, 1);
    const result = applier.applyTickDelta(
      tickDeltaPacket({
        debug: { paths: [{ entityId: eid(42), path: [] }] },
      }),
      6,
    );

    expect(result.rejectedMoves).toEqual([]);
  });

  it("marks debug path tiles for self entity", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(42) }));

    applier.applyTickDelta(
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

    expect(ctx.debug?.markPathTile).toHaveBeenCalledWith({ x: 1, y: 0, plane: 0 });
    expect(ctx.debug?.markPathTile).toHaveBeenCalledWith({ x: 2, y: 0, plane: 0 });
  });

  it("applies all debug overlays", () => {
    const ctx = createMockContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: eid(1) }));

    applier.applyTickDelta(
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

    expect(ctx.debug?.markTrueTile).toHaveBeenCalledWith({ x: 0, y: 0, plane: 0 }, eid(1));
    expect(ctx.debug?.markCollisionTile).toHaveBeenCalledWith({ x: 1, y: 1, plane: 0 });
    expect(ctx.debug?.markFootprint).toHaveBeenCalledWith({ x: 2, y: 2, plane: 0 });
    expect(ctx.debug?.markReachTiles).toHaveBeenCalledWith({ x: 3, y: 3, plane: 0 }, 2);
    expect(ctx.debug?.markLoSRay).toHaveBeenCalled();
    expect(ctx.debug?.setActionQueue).toHaveBeenCalledWith(["move", "attack"]);
    expect(ctx.debug?.setCombatCooldown).toHaveBeenCalledWith(3);
    expect(ctx.debug?.setPendingHits).toHaveBeenCalledWith(new Map([["5", 10]]));
    expect(ctx.debug?.setNpcLeash).toHaveBeenCalledWith({ x: 4, y: 4, plane: 0 });
    expect(ctx.debug?.setVarbits).toHaveBeenCalledWith(new Map([["q1", 1]]));
  });
});

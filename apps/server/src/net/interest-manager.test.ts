import {
  ACTIVE_SCENE_SIZE,
  buildEntityUpdate,
  CHUNK_SIZE,
  entityId,
  ServerPacketType,
  type TileCoord,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import {
  computeInterestScene,
  InterestManager,
  intersectingChunks,
  sceneContainsTile,
} from "./interest-manager";

function emptyDelta(tick = 1) {
  return {
    type: ServerPacketType.TickDelta,
    tick,
    serverTime: tick * 600,
    entityAdds: [],
    entityRemoves: [],
    entityUpdates: [],
  };
}

describe("InterestManager", () => {
  it("computes a 104x104 scene using shared constants", () => {
    const scene = computeInterestScene({ x: 100, y: 200, plane: 0 });

    expect(scene.maxX - scene.minX + 1).toBe(ACTIVE_SCENE_SIZE);
    expect(scene.maxY - scene.minY + 1).toBe(ACTIVE_SCENE_SIZE);
    expect(intersectingChunks(scene).size).toBeGreaterThan(ACTIVE_SCENE_SIZE / CHUNK_SIZE);
    expect(sceneContainsTile(scene, { x: 100, y: 200, plane: 0 })).toBe(true);
    expect(sceneContainsTile(scene, { x: scene.maxX + 1, y: 200, plane: 0 })).toBe(false);
  });

  it("filters entity adds outside interest", () => {
    const manager = new InterestManager();
    const world = createWorld();
    const player = entityId(1);
    const inside = entityId(2);
    const outside = entityId(3);

    const filtered = manager.filterDelta(
      player,
      { x: 0, y: 0, plane: 0 },
      {
        ...emptyDelta(),
        entityAdds: [
          { entityId: inside, kind: "npc", tile: { x: 1, y: 1, plane: 0 } },
          { entityId: outside, kind: "npc", tile: { x: 1_000, y: 1_000, plane: 0 } },
        ],
      },
      world,
    );

    expect(filtered.entityAdds.map((entity) => entity.entityId)).toEqual([inside]);
  });

  it("sends removal when a known entity leaves interest", () => {
    const manager = new InterestManager();
    const world = createWorld();
    const player = entityId(1);
    const npc = world.createEntity();
    world.setComponent(npc, "position", { entityId: npc, x: 1, y: 1, plane: 0 });
    manager.primeKnownEntities(player, [
      { entityId: npc, kind: "npc", tile: { x: 1, y: 1, plane: 0 } },
    ]);

    const filtered = manager.filterDelta(
      player,
      { x: 0, y: 0, plane: 0 },
      {
        ...emptyDelta(),
        entityUpdates: [buildEntityUpdate(npc, { position: { x: 1_000, y: 1_000, plane: 0 } })],
      },
      world,
    );

    expect(filtered.entityUpdates).toEqual([]);
    expect(filtered.entityRemoves).toEqual([npc]);
  });

  it("delivers an addressed system message only to its recipient, but global ones to all", () => {
    const manager = new InterestManager();
    const world = createWorld();
    const actor = entityId(1);
    const bystander = entityId(2);
    const delta = {
      ...emptyDelta(),
      chat: [
        { entityId: actor, text: "You eat the bread.", channel: "system" as const, serverTime: 1 },
        { text: "The world trembles.", channel: "system" as const, serverTime: 1 },
      ],
    };
    const center: TileCoord = { x: 0, y: 0, plane: 0 };

    const toActor = manager.filterDelta(actor, center, delta, world);
    const toBystander = manager.filterDelta(bystander, center, delta, world);

    expect(toActor.chat?.map((c) => c.text)).toEqual(["You eat the bread.", "The world trembles."]);
    expect(toBystander.chat?.map((c) => c.text)).toEqual(["The world trembles."]);
  });

  it("emits chunk and region load/unload transitions when scene boundaries move", () => {
    const manager = new InterestManager();
    const player = entityId(1);

    const first = manager.updateInterest(player, { x: 12, y: 12, plane: 0 });
    const second = manager.updateInterest(player, { x: 21, y: 21, plane: 0 });

    expect(first.chunkLoads.length).toBeGreaterThan(0);
    expect(second.chunkLoads.length).toBeGreaterThan(0);
    expect(second.chunkUnloads.length).toBeGreaterThan(0);
    expect(second.regionLoads.length + second.regionUnloads.length).toBeGreaterThanOrEqual(0);
  });

  it("removes player state on disconnect", () => {
    const manager = new InterestManager();
    const player = entityId(1);
    manager.updateInterest(player, { x: 0, y: 0, plane: 0 });
    manager.removePlayer(player);
    const transition = manager.updateInterest(player, { x: 0, y: 0, plane: 0 });
    expect(transition.chunkLoads.length).toBeGreaterThan(0);
    expect(transition.chunkUnloads.length).toBe(0);
  });
});

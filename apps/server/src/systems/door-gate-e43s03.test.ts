import { tileKey } from "@old-town/shared/types/coords";
import type { EntityId, ObjectDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap, objectCollisionFlags } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleDoorOpenIntent } from "./door-system";

const WOODEN_DOOR_DEF: ObjectDef = {
  id: "building_door_wood",
  name: "Wooden Door",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  isDoor: true,
  options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const TOWN_GATE_DEF: ObjectDef = {
  id: "building_gate_town",
  name: "Town Gate",
  width: 2,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  isDoor: true,
  isGate: true,
  options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

function addOpenTiles(map: ReturnType<typeof createRuntimeMap>): void {
  for (let x = 0; x < 64; x += 1) {
    for (let y = 0; y < 64; y += 1) {
      map.tiles.set(tileKey({ x, y, plane: 0 }), {
        tile: { x, y, plane: 0 },
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function addPlayer(world: World, x = 1, y = 1): EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  return entityId;
}

function addObject(world: World, objectId: string, x = 2, y = 1): EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", {
    entityId,
    objectId,
    facing: 0,
    variant: 0,
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const registries = makeRegistries({
    object: new Map<string, ObjectDef>([
      [WOODEN_DOOR_DEF.id, WOODEN_DOOR_DEF],
      [TOWN_GATE_DEF.id, TOWN_GATE_DEF],
    ]),
  });
  const ctx = {
    world,
    collision,
    deltas,
    actionQueue,
    registries,
    rng: { nextFloat: () => 0, nextInt: () => 0, chanceOneIn: () => false },
    itemAudit: undefined,
  };
  return { ctx, world, deltas, collision };
}

describe("E43-S03 — Door and gate interaction with dynamic collision", () => {
  it("opening a wooden door removes movement block on the door tile", () => {
    const { ctx, world, collision } = setup();
    const player = addPlayer(world, 1, 1);
    const door = addObject(world, "building_door_wood", 2, 1);

    collision.applyFootprint(
      { x: 2, y: 1, plane: 0 },
      { width: 1, length: 1 },
      objectCollisionFlags(WOODEN_DOOR_DEF),
    );
    expect(collision.canOccupy({ x: 2, y: 1, plane: 0 })).toBe(false);

    const result = handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);
    expect(result).toBe(true);

    expect(collision.canOccupy({ x: 2, y: 1, plane: 0 })).toBe(true);
  });

  it("closing a wooden door restores movement block", () => {
    const { ctx, world, collision } = setup();
    const player = addPlayer(world, 1, 1);
    const door = addObject(world, "building_door_wood", 2, 1);

    handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);
    expect(collision.canOccupy({ x: 2, y: 1, plane: 0 })).toBe(true);

    handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);
    expect(collision.canOccupy({ x: 2, y: 1, plane: 0 })).toBe(false);
  });

  it("opening a town gate (2×1) removes movement block on both tiles", () => {
    const { ctx, world, collision } = setup();
    const player = addPlayer(world, 1, 1);
    const gate = addObject(world, "building_gate_town", 3, 3);

    collision.applyFootprint(
      { x: 3, y: 3, plane: 0 },
      { width: 2, length: 1 },
      objectCollisionFlags(TOWN_GATE_DEF),
    );
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 4, y: 3, plane: 0 })).toBe(false);

    const result = handleDoorOpenIntent(ctx, player, gate, TOWN_GATE_DEF, 0, 0);
    expect(result).toBe(true);

    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(true);
    expect(collision.canOccupy({ x: 4, y: 3, plane: 0 })).toBe(true);
  });

  it("closing a town gate restores movement block on both tiles", () => {
    const { ctx, world, collision } = setup();
    const player = addPlayer(world, 1, 1);
    const gate = addObject(world, "building_gate_town", 3, 3);

    handleDoorOpenIntent(ctx, player, gate, TOWN_GATE_DEF, 0, 0);
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(true);
    expect(collision.canOccupy({ x: 4, y: 3, plane: 0 })).toBe(true);

    handleDoorOpenIntent(ctx, player, gate, TOWN_GATE_DEF, 0, 0);
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 4, y: 3, plane: 0 })).toBe(false);
  });

  it("door state is broadcast in the tick delta as doorState", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const door = addObject(world, "building_door_wood", 2, 1);

    handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);

    const peek = deltas.peek();
    const update = peek.entityUpdates?.find((u) => u.entityId === door);
    expect(update).toBeDefined();
    expect(update!.changes.doorState).toEqual({ isOpen: true });
  });

  it("two players see the same door state after a tick delta", () => {
    const { ctx, world, deltas } = setup();
    const player1 = addPlayer(world, 1, 1);
    addPlayer(world, 3, 1);
    const door = addObject(world, "building_door_wood", 2, 1);

    handleDoorOpenIntent(ctx, player1, door, WOODEN_DOOR_DEF, 0, 0);

    const tickDelta = deltas.consume(0, 0);
    expect(tickDelta.entityUpdates).toBeDefined();

    const doorUpdate = tickDelta.entityUpdates?.find((u) => u.entityId === door);
    expect(doorUpdate).toBeDefined();
    expect(doorUpdate?.changes.doorState).toEqual({ isOpen: true });

    const doorState = world.getComponent(door, "doorState");
    expect(doorState?.isOpen).toBe(true);
  });
});

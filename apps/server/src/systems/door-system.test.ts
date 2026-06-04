import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleDoorOpenIntent } from "./door-system";
import { tileKey } from "@old-town/shared/types/coords";

const WOODEN_DOOR_DEF = {
  id: "wooden_door",
  name: "Wooden Door",
  examine: "A plain plank door.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
  model: "model_wooden_door",
  defaultRotation: 0,
};

const SUPPLY_CHEST_DEF = {
  id: "supply_chest",
  name: "Supply Chest",
  examine: "A scuffed chest.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
  model: "model_supply_chest",
  defaultRotation: 0,
};

const SIGNPOST_DEF = {
  id: "signpost",
  name: "Signpost",
  examine: "A sign.",
  width: 1,
  length: 1,
  blocksMovement: false,
  blocksLineOfSight: false,
  options: [{ label: "Read", actionId: "read", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

function addPlayer(world: World, x = 1, y = 1): import("@old-town/shared/types/ids").EntityId {
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

function addObject(world: World, objectId: string, x = 2, y = 1): import("@old-town/shared/types/ids").EntityId {
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

function setup() {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const registries = makeRegistries({
    object: new Map([
      [WOODEN_DOOR_DEF.id, WOODEN_DOOR_DEF],
      [SUPPLY_CHEST_DEF.id, SUPPLY_CHEST_DEF],
      [SIGNPOST_DEF.id, SIGNPOST_DEF],
    ]),
    item: new Map([
      [
        "coin",
        {
          id: "coin",
          name: "Coin",
          stackable: true,
          tradeable: true,
          examine: "Currency.",
          icon: "icon_coin",
          value: 1,
          options: [],
          tags: [],
        },
      ],
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

describe("door system", () => {
  it("opens a closed door and toggles collision", () => {
    const { ctx, world, deltas, collision } = setup();
    const player = addPlayer(world, 1, 1);
    const door = addObject(world, "wooden_door", 2, 1);

    const tile = { x: 2, y: 1, plane: 0 as const };
    expect(collision.canOccupy(tile)).toBe(true);

    const result = handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);
    expect(result).toBe(true);

    const doorState = world.getComponent(door, "doorState");
    expect(doorState?.isOpen).toBe(true);

    expect(collision.canOccupy(tile)).toBe(true);

    const peek = deltas.peek();
    expect(peek.sounds?.[0]?.soundId).toBe("door_open");
    expect(peek.entityUpdates?.some((u) => u.entityId === door && u.changes.animation?.id === "door_open")).toBe(true);
    expect(peek.chat?.[0]?.text).toBe("You open the door.");
  });

  it("closes an open door and restores collision", () => {
    const { ctx, world, deltas, collision } = setup();
    const player = addPlayer(world, 1, 1);
    const door = addObject(world, "wooden_door", 2, 1);

    const tile = { x: 2, y: 1, plane: 0 as const };
    handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);
    expect(collision.canOccupy(tile)).toBe(true);
    deltas.consume(0, 0); // clear first open deltas

    const result = handleDoorOpenIntent(ctx, player, door, WOODEN_DOOR_DEF, 0, 0);
    expect(result).toBe(true);

    const doorState = world.getComponent(door, "doorState");
    expect(doorState?.isOpen).toBe(false);

    expect(collision.canOccupy(tile)).toBe(false);

    const peek = deltas.peek();
    expect(peek.sounds?.[0]?.soundId).toBe("door_close");
    expect(peek.chat?.[0]?.text).toBe("You close the door.");
  });

  it("returns false for non-door/chest objects", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const sign = addObject(world, "signpost", 2, 1);

    const result = handleDoorOpenIntent(ctx, player, sign, SIGNPOST_DEF, 0, 0);
    expect(result).toBe(false);
  });

  it("opens a chest and spawns ground items", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const chest = addObject(world, "supply_chest", 2, 1);

    const result = handleDoorOpenIntent(ctx, player, chest, SUPPLY_CHEST_DEF, 0, 0);
    expect(result).toBe(true);

    const doorState = world.getComponent(chest, "doorState");
    expect(doorState?.isOpen).toBe(true);

    const peek = deltas.peek();
    expect(peek.sounds?.[0]?.soundId).toBe("chest_open");
    expect(peek.entityUpdates?.some((u) => u.entityId === chest && u.changes.animation?.id === "chest_open")).toBe(true);
    expect(peek.chat?.[0]?.text).toBe("You open the chest and find some items.");

    // Ground item should be spawned on the chest tile
    const groundItems = Array.from(world.componentEntries("groundItem"));
    expect(groundItems.length).toBeGreaterThan(0);
    const first = groundItems[0]!;
    const [itemEntityId, item] = first;
    expect(item.itemId).toBe("coin");
    expect(item.quantity).toBe(5);
    const pos = world.getComponent(itemEntityId, "position");
    expect(pos?.x).toBe(2);
    expect(pos?.y).toBe(1);
  });

  it("closes an open chest", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const chest = addObject(world, "supply_chest", 2, 1);

    handleDoorOpenIntent(ctx, player, chest, SUPPLY_CHEST_DEF, 0, 0);
    deltas.consume(0, 0); // clear first open deltas
    handleDoorOpenIntent(ctx, player, chest, SUPPLY_CHEST_DEF, 0, 0);

    const doorState = world.getComponent(chest, "doorState");
    expect(doorState?.isOpen).toBe(false);

    const peek = deltas.peek();
    expect(peek.sounds?.[0]?.soundId).toBe("chest_close");
    expect(peek.chat?.[0]?.text).toBe("You close the chest.");
  });
});

import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleObjectIntent } from "./object-interaction-router";
import { tileKey } from "@old-town/shared";

const OBJECT_DEF = {
  id: "signpost",
  name: "Signpost",
  examine: "A weathered wooden signpost.",
  dialogueId: "signpost_dialogue",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const DIALOGUE_DEF = {
  id: "signpost_dialogue",
  name: "Signpost Message",
  root: "start",
  nodes: [
    {
      id: "start",
      npcText: "Welcome to Old Town.",
      playerOptions: [],
      requirements: [],
      effects: [],
    },
  ],
};

const ALTAR_DEF = {
  id: "altar",
  name: "Altar",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const TRAP_BASE_DEF = {
  id: "trap_base",
  name: "Trap Base",
  examine: "A base for setting traps.",
  width: 1,
  length: 1,
  blocksMovement: false,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

function addPlayer(world: World, x = 1, y = 1): import("@old-town/shared").EntityId {
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

function addObject(world: World, objectId: string, x = 2, y = 1): import("@old-town/shared").EntityId {
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
  const actionRuntime = new ActionRuntime();
  const registries = makeRegistries({
    object: new Map([
      [OBJECT_DEF.id, OBJECT_DEF],
      [ALTAR_DEF.id, ALTAR_DEF],
      [TRAP_BASE_DEF.id, TRAP_BASE_DEF],
    ]),
    dialogue: new Map([[DIALOGUE_DEF.id, DIALOGUE_DEF]]),
  });
  const ctx = {
    world,
    collision,
    deltas,
    actionRuntime,
    registries,
    rng: { nextFloat: () => 0, nextInt: () => 0, chanceOneIn: () => false },
    itemAudit: undefined,
  };
  return { ctx, world, deltas };
}

describe("object interaction router", () => {
  it("inspects an object and shows examine text", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "inspect", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("A weathered wooden signpost.");
  });

  it("inspects an object with no examine text and shows fallback", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "altar", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "inspect", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You see nothing special.");
  });

  it("reads an object with dialogue and opens dialogue", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "read", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const delta = deltas.peek();
    expect(delta.interfaceOpens?.[0]).toMatchObject({
      interfaceId: "dialogue",
      dialogue: {
        dialogueId: "signpost_dialogue",
        nodeId: "start",
        speakerName: "Signpost",
      },
    });
  });

  it("reads an object with no dialogue and shows fallback message", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "altar", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "read", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("There is nothing to read.");
  });

  it("routes pray action to favour system", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "altar", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "pray", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You need an offering to pray at the shrine.");
  });

  it("routes fire action to skilling system", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "trap_base", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "fire", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("routes weave action to skilling system", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "trap_base", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "weave", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("returns false for unknown object action", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "dance", objectEntityId: object }, 0);
    expect(result).toBe(false);
  });

  it("paths to object when out of range", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 5, 5);

    const result = handleObjectIntent(ctx, player, { actionId: "inspect", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const movement = world.getComponent(player, "movement");
    expect(movement?.path.length).toBeGreaterThan(0);
  });
});

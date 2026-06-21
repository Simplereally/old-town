import { type ObjectDef, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionQueue, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleBeginInteract, handleObjectIntent } from "./object-interaction-router";

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

function addObject(
  world: World,
  objectId: string,
  x = 2,
  y = 1,
): import("@old-town/shared").EntityId {
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
  const objectDefs = new Map<string, ObjectDef>([
    [OBJECT_DEF.id, OBJECT_DEF],
    [ALTAR_DEF.id, ALTAR_DEF],
    [TRAP_BASE_DEF.id, TRAP_BASE_DEF],
  ]);
  const registries = makeRegistries({
    object: objectDefs,
    dialogue: new Map([[DIALOGUE_DEF.id, DIALOGUE_DEF]]),
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
  return { ctx, world, deltas, objectDefs };
}

describe("object interaction router", () => {
  it("inspects an object and shows examine text", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "inspect", objectEntityId: object },
      0,
    );
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("A weathered wooden signpost.");
  });

  it("inspects an object with no examine text and shows fallback", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "altar", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "inspect", objectEntityId: object },
      0,
    );
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

  it("routes fire action to processing system", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "trap_base", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "fire", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You set a fire trap.");
  });

  it("routes weave action to trapping system with wrong object", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "trap_base", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "weave", objectEntityId: object },
      0,
    );
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You cannot do that here.");
  });

  it("returns false for unknown object action", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "dance", objectEntityId: object },
      0,
    );
    expect(result).toBe(false);
  });

  it("does not path or enqueue begin_interact for unknown out-of-range actions", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 5, 5);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "dance", objectEntityId: object },
      0,
    );
    expect(result).toBe(false);

    expect(world.getComponent(player, "movement")).toBeUndefined();
    expect(ctx.actionQueue.getDebugState()).toEqual([]);
  });

  it("paths to object when out of range", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 5, 5);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "inspect", objectEntityId: object },
      0,
    );
    expect(result).toBe(true);

    const movement = world.getComponent(player, "movement");
    expect(movement?.path.length).toBeGreaterThan(0);
  });

  it("teleports player on enter with transitionDestination", () => {
    const { ctx, world, objectDefs } = setup();
    const player = addPlayer(world, 1, 1);
    const doorDef = {
      ...OBJECT_DEF,
      id: "door",
      name: "Door",
      transitionDestination: { x: 10, y: 10, plane: 0 as const },
    };
    objectDefs.set("door", doorDef);
    const object = addObject(world, "door", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "enter", objectEntityId: object },
      0,
    );
    expect(result).toBe(true);

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(10);
    expect(position?.y).toBe(10);
  });

  it("shows message on enter without transitionDestination", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "enter", objectEntityId: object },
      0,
    );
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You cannot enter that.");
  });

  it("rings an object and emits sound", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "ring", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    const sounds = deltas.peek().sounds;
    expect(chat?.[0]?.text).toBe("You ring the bell.");
    expect(sounds?.[0]?.soundId).toBe("bell_ring");
  });

  it("reads object text when available", () => {
    const { ctx, world, deltas, objectDefs } = setup();
    const player = addPlayer(world, 1, 1);
    const textDef = { ...OBJECT_DEF, id: "text_sign", text: "Beware of dog." };
    objectDefs.set("text_sign", textDef);
    const object = addObject(world, "text_sign", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "read", objectEntityId: object }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("Beware of dog.");
  });

  it("enqueues begin_interact when out of range for non-skilling actions", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 5, 5);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "inspect", objectEntityId: object },
      0,
    );
    expect(result).toBe(true);

    const movement = world.getComponent(player, "movement");
    expect(movement?.path.length).toBeGreaterThan(0);

    const queue = ctx.actionQueue.getDebugState();
    expect(queue.some((q) => q.id === `approach:${player}`)).toBe(true);
    expect(queue.some((q) => (q.payload as { kind: string })?.kind === "begin_interact")).toBe(true);
  });

  it("cancels impossible begin_interact skilling actions", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const object = addObject(world, "signpost", 2, 1);
    const payload = {
      kind: "begin_interact",
      objectEntityId: object,
      actionId: "woodcut",
    } as const;
    ctx.actionQueue.enqueue({
      id: `begin-interact:${player}`,
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 0,
      repeat: { intervalTicks: 1 },
      interruptGroup: InterruptGroup.Skilling,
      payload,
    });
    const execution = ctx.actionQueue.advanceTick()[0];
    if (!execution) {
      throw new Error("Expected queued begin_interact execution");
    }

    handleBeginInteract(ctx, execution, payload, 0, 0);

    expect(ctx.actionQueue.getDebugState()).toEqual([]);
    expect(deltas.peek().chat?.[0]?.text).toBe("You cannot do that.");
  });

  it("routes open action to door system and toggles door state", () => {
    const { ctx, world, deltas, objectDefs } = setup();
    const player = addPlayer(world, 1, 1);
    const doorDef = {
      ...OBJECT_DEF,
      id: "wooden_door",
      name: "Wooden Door",
      blocksMovement: true,
      blocksLineOfSight: true,
      options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
    };
    objectDefs.set("wooden_door", doorDef);
    const object = addObject(world, "wooden_door", 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "open", objectEntityId: object },
      0,
      0,
    );
    expect(result).toBe(true);

    const doorState = world.getComponent(object, "doorState");
    expect(doorState?.isOpen).toBe(true);

    const peek = deltas.peek();
    expect(peek.sounds?.[0]?.soundId).toBe("door_open");
    expect(peek.chat?.[0]?.text).toBe("You open the door.");
  });
});

import { tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleObjectIntent } from "./object-interaction-router";

const MAP_TABLE_DEF = {
  id: "map_table",
  name: "Map Table",
  examine: "A table covered in maps, surveys, and chalked routes.",
  width: 2,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Survey", actionId: "survey", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const QUILL_DEF = {
  id: "survey_quill",
  name: "Survey Quill",
  stackable: false,
  tradeable: true,
  examine: "A fine quill for marking maps.",
  icon: "icon_survey_quill",
  value: 8,
  weight: 0.1,
  options: ["use"],
  tags: ["survey_tool"],
};

const PARCHMENT_DEF = {
  id: "survey_parchment",
  name: "Survey Parchment",
  stackable: true,
  tradeable: true,
  examine: "Blank parchment for charting new terrain.",
  icon: "icon_survey_parchment",
  value: 5,
  weight: 0.1,
  options: ["use"],
  tags: ["survey_tool"],
};

const NON_TABLE_DEF = {
  id: "non_table",
  name: "Non Table",
  examine: "Not a map table.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const CARTOGRAPHY_SKILL_DEF = {
  id: "cartography",
  name: "Cartography",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: false,
  unlocks: [],
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
  world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      cartography: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function addMapTable(world: World, x = 2, y = 1): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", {
    entityId,
    objectId: "map_table",
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
      [MAP_TABLE_DEF.id, MAP_TABLE_DEF],
      [NON_TABLE_DEF.id, NON_TABLE_DEF],
    ]),
    item: new Map([
      [QUILL_DEF.id, QUILL_DEF],
      [PARCHMENT_DEF.id, PARCHMENT_DEF],
    ]),
    skill: new Map([[CARTOGRAPHY_SKILL_DEF.id, CARTOGRAPHY_SKILL_DEF]]),
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
  return { ctx, world, deltas };
}

describe("cartography system", () => {
  it("survey requires survey tool", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const table = addMapTable(world, 2, 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "survey", objectEntityId: table },
      0,
    );
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You need a quill or parchment to survey.");
  });

  it("survey reveals map tiles and awards XP", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const table = addMapTable(world, 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "survey_quill", 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "survey", objectEntityId: table },
      0,
    );
    expect(result).toBe(true);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.some((d) => d.skillId === "cartography")).toBe(true);

    const vars = world.getComponent(player, "vars");
    expect(vars?.values.map_revealed_tiles).toBeDefined();
  });

  it("survey reveals tiles in radius around map table", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 4, 5);
    const table = addMapTable(world, 5, 5);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "survey_parchment", 1);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "survey", objectEntityId: table },
      0,
    );
    expect(result).toBe(true);

    const vars = world.getComponent(player, "vars");
    const revealed = vars?.values.map_revealed_tiles;
    expect(revealed).toBeDefined();
    if (typeof revealed === "string") {
      const tiles = JSON.parse(revealed) as string[];
      expect(tiles.length).toBeGreaterThan(0);
      expect(tiles.some((t) => t.includes("5,5"))).toBe(true);
    }
  });

  it("survey at non-map table shows error", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const nonTable = world.createEntity();
    world.setComponent(nonTable, "position", { entityId: nonTable, x: 2, y: 1, plane: 0 });
    world.setComponent(nonTable, "object", {
      entityId: nonTable,
      objectId: "non_table",
      facing: 0,
      variant: 0,
    });

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "survey", objectEntityId: nonTable },
      0,
    );
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You cannot survey here.");
  });
});

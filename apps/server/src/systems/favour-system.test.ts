import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory, addItem, catalogFromItems } from "../items/inventory";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleObjectIntent } from "./object-interaction-router";
import { tileKey } from "@old-town/shared";

const SHRINE_HEARTH_DEF = {
  id: "shrine_hearth",
  name: "Shrine Hearth",
  examine: "A low flame surrounded by candles. The shrine's heart.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const OFFERING_ITEM_DEF = {
  id: "shrine_candle",
  name: "Shrine Candle",
  stackable: true,
  tradeable: true,
  examine: "A small candle for lighting at the shrine hearth.",
  icon: "icon_shrine_candle",
  value: 5,
  weight: 0.1,
  options: ["light"],
  tags: ["offering"],
};

const NON_OFFERING_ITEM_DEF = {
  id: "raw_bread",
  name: "Raw Bread",
  stackable: true,
  tradeable: true,
  examine: "Unbaked bread dough.",
  icon: "icon_raw_bread",
  value: 2,
  weight: 0.3,
  options: ["cook"],
  tags: ["food"],
};

const NON_SHRINE_DEF = {
  id: "non_shrine",
  name: "Non Shrine",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const FAVOUR_SKILL_DEF = {
  id: "favour",
  name: "Favour",
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
      favour: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
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
      [SHRINE_HEARTH_DEF.id, SHRINE_HEARTH_DEF],
      [NON_SHRINE_DEF.id, NON_SHRINE_DEF],
    ]),
    item: new Map([
      [OFFERING_ITEM_DEF.id, OFFERING_ITEM_DEF],
      [NON_OFFERING_ITEM_DEF.id, NON_OFFERING_ITEM_DEF],
    ]),
    skill: new Map([[FAVOUR_SKILL_DEF.id, FAVOUR_SKILL_DEF]]),
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

describe("favour system", () => {
  it("pray at shrine without offering shows message", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const shrine = addObject(world, "shrine_hearth", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "pray", objectEntityId: shrine }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You need an offering to pray at the shrine.");
  });

  it("pray at shrine consumes offering and awards Favour XP", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const shrine = addObject(world, "shrine_hearth", 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "shrine_candle", 3);

    const result = handleObjectIntent(ctx, player, { actionId: "pray", objectEntityId: shrine }, 0);
    expect(result).toBe(true);

    const afterCount = inventory.slots.reduce((sum, slot) => {
      if (slot?.itemId === "shrine_candle") {
        return sum + slot.quantity;
      }
      return sum;
    }, 0);
    expect(afterCount).toBe(2);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.length).toBeGreaterThan(0);
    expect(xpDrops?.[0]?.skillId).toBe("favour");
    expect(xpDrops?.[0]?.amount).toBeGreaterThan(0);
  });

  it("pray at non-shrine shows no shrine message", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const nonShrine = world.createEntity();
    world.setComponent(nonShrine, "position", { entityId: nonShrine, x: 2, y: 1, plane: 0 });
    world.setComponent(nonShrine, "object", {
      entityId: nonShrine,
      objectId: "non_shrine",
      facing: 0,
      variant: 0,
    });

    const result = handleObjectIntent(ctx, player, { actionId: "pray", objectEntityId: nonShrine }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You cannot pray here.");
  });

  it("pray at shrine awards enough XP for Favour level up", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const shrine = addObject(world, "shrine_hearth", 2, 1);
    const skills = world.getComponent(player, "skills");
    expect(skills).toBeDefined();
    if (!skills) return;
    const favourSkill = skills.skills.favour;
    expect(favourSkill).toBeDefined();
    if (!favourSkill) return;

    favourSkill.xp = 80;
    favourSkill.level = 1;

    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "shrine_candle", 1);

    const result = handleObjectIntent(ctx, player, { actionId: "pray", objectEntityId: shrine }, 0);
    expect(result).toBe(true);

    const updatedSkills = world.getComponent(player, "skills");
    const updatedFavour = updatedSkills?.skills.favour;
    expect(updatedFavour).toBeDefined();
    if (!updatedFavour) return;
    expect(updatedFavour.level).toBeGreaterThan(1);
    expect(updatedFavour.xp).toBeGreaterThan(80);

    const skillDeltas = deltas.peek().skillDelta;
    expect(skillDeltas?.some((d) => d.skillId === "favour" && d.level > 1)).toBe(true);
  });
});

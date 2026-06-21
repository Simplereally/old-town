import { tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import type { GatherActionPayload } from "./skilling-system";
import { handleGather, handleObjectSkillingIntent } from "./skilling-system";

const FISHING_SPOT_DEF = {
  id: "fishing_spot",
  name: "Fishing Spot",
  examine: "A calm pool of water with fish swimming beneath.",
  width: 1,
  length: 1,
  blocksMovement: false,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const FISHING_NODE_DEF = {
  id: "fishing_spot",
  name: "Fishing Spot",
  skill: "fishing",
  requiredLevel: 1,
  baseXp: 15,
  actionTicks: 5,
  depletionChance: 0.3,
  respawnTicks: 10,
  toolTags: ["fishing_rod"],
  outputItemId: "raw_fish",
  outputQuantity: 1,
  baseChance: 0.3,
  levelScale: 0.01,
};

const FISHING_ROD_DEF = {
  id: "fishing_rod",
  name: "Fishing Rod",
  stackable: false,
  tradeable: true,
  examine: "A simple rod for catching fish.",
  icon: "icon_fishing_rod",
  value: 10,
  weight: 1.0,
  options: ["wield"],
  tags: ["fishing_rod"],
  equipment: {
    slot: "weapon",
    bonuses: {},
    requirements: [],
  },
};

const RAW_FISH_DEF = {
  id: "raw_fish",
  name: "Raw Fish",
  stackable: true,
  tradeable: true,
  examine: "A fresh fish, ready to cook.",
  icon: "icon_raw_fish",
  value: 5,
  weight: 0.5,
  options: ["cook", "drop"],
  tags: ["food", "raw_fish"],
};

const FISHING_SKILL_DEF = {
  id: "fishing",
  name: "Fishing",
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
      fishing: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  return entityId;
}

function addFishingSpot(world: World, x = 2, y = 1): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", {
    entityId,
    objectId: "fishing_spot",
    facing: 0,
    variant: 0,
  });
  world.setComponent(entityId, "resourceNode", {
    entityId,
    nodeId: "fishing_spot",
    active: true,
    depleted: false,
    respawnTick: 0,
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
    object: new Map([[FISHING_SPOT_DEF.id, FISHING_SPOT_DEF]]),
    item: new Map([
      [FISHING_ROD_DEF.id, FISHING_ROD_DEF],
      [RAW_FISH_DEF.id, RAW_FISH_DEF],
    ]),
    skill: new Map([[FISHING_SKILL_DEF.id, FISHING_SKILL_DEF]]),
    resourceNode: new Map([[FISHING_NODE_DEF.id, FISHING_NODE_DEF]]),
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

describe("fishing action support", () => {
  it("requires fishing rod to fish", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const spot = addFishingSpot(world, 2, 1);

    const result = handleObjectSkillingIntent(
      ctx,
      player,
      { actionId: "fish", objectEntityId: spot },
      0,
    );
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You need the right tool for Fishing Spot.");
  });

  it("fishing with rod succeeds and awards fish", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const spot = addFishingSpot(world, 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "fishing_rod", 1);

    const result = handleObjectSkillingIntent(
      ctx,
      player,
      { actionId: "fish", objectEntityId: spot },
      0,
    );
    expect(result).toBe(true);

    const debugState = ctx.actionQueue.getDebugState();
    const queued = debugState.filter((entry) => entry.owner === player);
    expect(queued.length).toBeGreaterThan(0);
    expect((queued[0]?.payload as { kind: string }).kind).toBe("gather");
  });

  it("fishing gather awards XP and fish", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const spot = addFishingSpot(world, 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "fishing_rod", 1);

    const gatherPayload: GatherActionPayload = { kind: "gather", nodeEntityId: spot };
    handleGather(
      ctx,
      {
        entry: {
          id: "gather:1",
          owner: player,
          type: "weak" as const,
          delayTicks: 5,
          interruptGroup: "skilling" as const,
          payload: gatherPayload,
          repeat: { intervalTicks: 5 },
        },
        executionCount: 1,
      },
      gatherPayload,
      1,
      0,
    );

    const fishCount = inventory.slots.reduce((sum, slot) => {
      if (slot?.itemId === "raw_fish") {
        return sum + slot.quantity;
      }
      return sum;
    }, 0);
    expect(fishCount).toBe(1);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.length).toBeGreaterThan(0);
    expect(xpDrops?.[0]?.skillId).toBe("fishing");
    expect(xpDrops?.[0]?.amount).toBe(15);
  });

  it("fishing spot depletes after successful catch", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const spot = addFishingSpot(world, 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "fishing_rod", 1);

    // Force depletion by setting rng to return 0 for depletion check
    const depletingCtx = {
      ...ctx,
      rng: {
        nextFloat: () => 0.1,
        nextInt: (_min: number, _max: number) => 0,
        chanceOneIn: () => false,
      },
    };

    const depletingPayload: GatherActionPayload = { kind: "gather", nodeEntityId: spot };
    handleGather(
      depletingCtx,
      {
        entry: {
          id: "gather:1",
          owner: player,
          type: "weak" as const,
          delayTicks: 5,
          interruptGroup: "skilling" as const,
          payload: depletingPayload,
          repeat: { intervalTicks: 5 },
        },
        executionCount: 1,
      },
      depletingPayload,
      1,
      0,
    );

    const node = world.getComponent(spot, "resourceNode");
    expect(node?.depleted).toBe(true);

    const debugState = depletingCtx.actionQueue.getDebugState();
    const cancelled = !debugState.some(
      (entry) => entry.owner === player && (entry.payload as { kind: string }).kind === "gather",
    );
    expect(cancelled).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  checkPublicWorkCompletion,
  contributeToPublicWork,
  createPublicWork,
  distributePublicWorkRewards,
} from "./public-works-system";

const COIN_DEF = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "A copper coin.",
  icon: "icon_coin",
  value: 1,
  weight: 0.0,
  options: [],
  tags: [],
};

const REWARD_ITEM_DEF = {
  id: "reward_badge",
  name: "Reward Badge",
  stackable: true,
  tradeable: true,
  examine: "A badge for helping.",
  icon: "icon_badge",
  value: 10,
  weight: 0.1,
  options: [],
  tags: [],
};

function addPlayer(world: World, x: number, y: number): import("@old-town/shared").EntityId {
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
      construction: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    item: new Map([
      [COIN_DEF.id, COIN_DEF],
      [REWARD_ITEM_DEF.id, REWARD_ITEM_DEF],
    ]),
  });
  const ctx = {
    world,
    deltas,
    registries,
  };
  return { ctx, world, deltas };
}

describe("createPublicWork", () => {
  it("creates a public work component", () => {
    const { world } = setup();
    const entityId = world.createEntity();

    const publicWork = createPublicWork(
      world,
      entityId,
      "bridge_repair",
      "Bridge Repair",
      [{ itemId: "coin", quantity: 10 }],
      [{ itemId: "reward_badge", quantity: 1 }],
      [{ skillId: "construction", amount: 50 }],
    );

    expect(publicWork.publicWorkId).toBe("bridge_repair");
    expect(publicWork.name).toBe("Bridge Repair");
    expect(publicWork.requiredResources).toEqual([{ itemId: "coin", quantity: 10 }]);
    expect(publicWork.completed).toBe(false);
  });
});

describe("contributeToPublicWork", () => {
  it("contributes resources and updates currentResources", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "coin", quantity: 20, uid: 1 };

    const workEntity = world.createEntity();
    createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);

    const result = contributeToPublicWork(ctx, player, workEntity, "coin", 5, 1, 0);

    expect(result).toBe(true);
    const publicWork = world.getComponent(workEntity, "publicWork");
    expect(publicWork?.currentResources).toEqual([{ itemId: "coin", quantity: 5 }]);
    expect(publicWork?.contributors).toEqual([{ playerId: player, itemId: "coin", quantity: 5 }]);
  });

  it("fails when public work is completed", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);
    const workEntity = world.createEntity();
    const publicWork = createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);
    publicWork.completed = true;
    world.setComponent(workEntity, "publicWork", publicWork);

    const result = contributeToPublicWork(ctx, player, workEntity, "coin", 5, 1, 0);

    expect(result).toBe(false);
  });

  it("fails when item is not required", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    const workEntity = world.createEntity();
    createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);

    const result = contributeToPublicWork(ctx, player, workEntity, "wood", 5, 1, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("That item is not required for this project.");
  });

  it("fails when player does not have enough items", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    const workEntity = world.createEntity();
    createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);

    const result = contributeToPublicWork(ctx, player, workEntity, "coin", 5, 1, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You do not have enough of that resource.");
  });

  it("caps contribution at remaining needed amount", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "coin", quantity: 20, uid: 1 };

    const workEntity = world.createEntity();
    createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);

    const result = contributeToPublicWork(ctx, player, workEntity, "coin", 15, 1, 0);

    expect(result).toBe(true);
    const publicWork = world.getComponent(workEntity, "publicWork");
    expect(publicWork?.currentResources[0]?.quantity).toBe(10);
  });
});

describe("checkPublicWorkCompletion", () => {
  it("marks as completed when all requirements are met", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "coin", quantity: 20, uid: 1 };

    const workEntity = world.createEntity();
    createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);

    contributeToPublicWork(ctx, player, workEntity, "coin", 10, 1, 0);

    const publicWork = world.getComponent(workEntity, "publicWork");
    expect(publicWork?.completed).toBe(true);
    const state = deltas.peek();
    expect(state.chat?.some((c) => c.text === "Bridge Repair has been completed!")).toBe(true);
  });

  it("does not complete when requirements are not met", () => {
    const { ctx, world } = setup();
    const workEntity = world.createEntity();
    createPublicWork(world, workEntity, "bridge_repair", "Bridge Repair", [
      { itemId: "coin", quantity: 10 },
    ]);

    const result = checkPublicWorkCompletion(ctx, workEntity, 0, 1);

    expect(result).toBe(false);
    const publicWork = world.getComponent(workEntity, "publicWork");
    expect(publicWork?.completed).toBe(false);
  });
});

describe("distributePublicWorkRewards", () => {
  it("distributes rewards to contributors", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "coin", quantity: 20, uid: 1 };

    const workEntity = world.createEntity();
    createPublicWork(
      world,
      workEntity,
      "bridge_repair",
      "Bridge Repair",
      [{ itemId: "coin", quantity: 10 }],
      [{ itemId: "reward_badge", quantity: 2 }],
      [{ skillId: "construction", amount: 50 }],
    );

    contributeToPublicWork(ctx, player, workEntity, "coin", 10, 1, 0);

    const state = deltas.peek();
    expect(
      state.chat?.some((c) => c.text === "You receive rewards for completing Bridge Repair."),
    ).toBe(true);
  });

  it("does not distribute rewards twice", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "coin", quantity: 20, uid: 1 };

    const workEntity = world.createEntity();
    createPublicWork(
      world,
      workEntity,
      "bridge_repair",
      "Bridge Repair",
      [{ itemId: "coin", quantity: 10 }],
      [{ itemId: "reward_badge", quantity: 2 }],
    );

    contributeToPublicWork(ctx, player, workEntity, "coin", 10, 1, 0);

    const result = distributePublicWorkRewards(ctx, workEntity, 0, 1);

    expect(result).toBe(false);
  });
});

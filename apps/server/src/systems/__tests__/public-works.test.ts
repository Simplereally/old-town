import type { ItemDef } from "@old-town/shared/content-schemas/item";
import type { SkillDef } from "@old-town/shared/content-schemas/skill";
import { entityId } from "@old-town/shared/types/ids";
import { describe, expect, it } from "vitest";
import { createWorld } from "../../ecs/world";
import { addItem, catalogFromItems, createInventory, count } from "../../items/inventory";
import { ItemAuditLog } from "../../items/item-audit";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import {
  contributeToPublicWork,
  checkPublicWorkCompletion,
  distributePublicWorkRewards,
  createPublicWork,
  type PublicWorkSystemContext,
} from "../public-works-system";

const PLAYER = entityId(0);
const PUBLIC_WORK_ENTITY = entityId(1);

const COIN: ItemDef = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "A small coin.",
  icon: "icon_coin",
  value: 1,
  options: [],
  tags: [],
};

const WOOD: ItemDef = {
  id: "wood",
  name: "Wood",
  stackable: true,
  tradeable: true,
  examine: "A piece of wood.",
  icon: "icon_wood",
  value: 2,
  options: [],
  tags: [],
};

const STONE: ItemDef = {
  id: "stone",
  name: "Stone",
  stackable: true,
  tradeable: true,
  examine: "A stone block.",
  icon: "icon_stone",
  value: 3,
  options: [],
  tags: [],
};

const REWARD_BADGE: ItemDef = {
  id: "reward_badge",
  name: "Reward Badge",
  stackable: false,
  tradeable: false,
  examine: "A quest reward badge.",
  icon: "icon_reward_badge",
  value: 0,
  options: [],
  tags: [],
};

const ATTACK_SKILL: SkillDef = {
  id: "attack",
  name: "Attack",
  maxLevel: 99,
  xpTableId: "oldtown_default",
  combat: true,
  unlocks: [],
};

const ITEMS = new Map([COIN, WOOD, STONE, REWARD_BADGE].map((d) => [d.id, d]));

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  const publicWorkEntity = world.createEntity();
  expect(publicWorkEntity).toBe(PUBLIC_WORK_ENTITY);

  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { attack: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(PLAYER, "vars", { entityId: PLAYER, values: {} });

  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    item: ITEMS,
    skill: new Map([[ATTACK_SKILL.id, ATTACK_SKILL]]),
  });

  const itemAudit = new ItemAuditLog();

  const ctx: PublicWorkSystemContext = {
    world,
    deltas,
    registries,
    itemAudit,
  };

  return { world, deltas, ctx, itemAudit };
}

const TICK = 100;
const SERVER_TIME = 1_000;

describe("public work contribution", () => {
  it("allows a player to donate resources and increments progress", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    const result = contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    expect(result).toBe(true);
    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.currentResources).toHaveLength(1);
    expect(publicWork?.currentResources[0]).toMatchObject({ itemId: "wood", quantity: 5 });
  });

  it("rejects contribution when player lacks resources", () => {
    const { world, ctx } = setup();

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    const result = contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You do not have enough of that resource.");
  });

  it("rejects contribution for items not required by the project", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "coin", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    const result = contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "coin", 5, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("That item is not required for this project.");
  });

  it("rejects contribution when resource requirement is already met", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);
    addItem(inventory, catalogFromItems(ITEMS), "stone", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [
        { itemId: "wood", quantity: 10 },
        { itemId: "stone", quantity: 5 },
      ],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 10, TICK, SERVER_TIME);
    const result = contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 1, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.at(-1)?.text).toBe("That resource requirement has already been met.");
  });

  it("rejects contribution when public work is already completed", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);
    const result = contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 1, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.at(-1)?.text).toBe("This public work has already been completed.");
  });

  it("partially accepts contribution when only part is needed", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    const result = contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 10, TICK, SERVER_TIME);

    expect(result).toBe(true);
    expect(count(inventory, "wood")).toBe(5);
    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.currentResources[0]?.quantity).toBe(5);
  });

  it("records item audit for contribution", () => {
    const { world, ctx, itemAudit } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const audit = itemAudit.snapshot();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      reason: "public_work_contribution",
      itemId: "wood",
      quantity: 5,
      beforeQuantity: 10,
      afterQuantity: 5,
    });
  });
});

describe("public work completion", () => {
  it("marks public work as completed when all resources are met", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);
    addItem(inventory, catalogFromItems(ITEMS), "stone", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [
        { itemId: "wood", quantity: 5 },
        { itemId: "stone", quantity: 3 },
      ],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);
    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "stone", 3, TICK, SERVER_TIME);

    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.completed).toBe(true);
  });

  it("sends completion message to contributors", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const chat = ctx.deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("Town Well has been completed!"))).toBe(true);
  });

  it("applies world change var on completion", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
      [],
      [],
      "well_built",
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const vars = world.getComponent(PLAYER, "vars");
    expect(vars?.values["publicWork.town_well.completed"]).toBe(true);
  });

  it("does not complete when resources are partially met", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [
        { itemId: "wood", quantity: 5 },
        { itemId: "stone", quantity: 3 },
      ],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.completed).toBe(false);
  });
});

describe("public work contributor tracking", () => {
  it("records who contributed what", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);
    addItem(inventory, catalogFromItems(ITEMS), "stone", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [
        { itemId: "wood", quantity: 5 },
        { itemId: "stone", quantity: 3 },
      ],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);
    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "stone", 3, TICK, SERVER_TIME);

    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.contributors).toHaveLength(2);
    expect(publicWork?.contributors[0]).toMatchObject({ playerId: PLAYER, itemId: "wood", quantity: 5 });
    expect(publicWork?.contributors[1]).toMatchObject({ playerId: PLAYER, itemId: "stone", quantity: 3 });
  });

  it("tracks multiple contributions from the same player", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 10 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);
    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.contributors).toHaveLength(2);
    expect(publicWork?.contributors[0]).toMatchObject({ playerId: PLAYER, itemId: "wood", quantity: 5 });
    expect(publicWork?.contributors[1]).toMatchObject({ playerId: PLAYER, itemId: "wood", quantity: 5 });
  });

  it("tracks contributions from multiple players", () => {
    const { world, ctx } = setup();
    const otherPlayer = world.createEntity();
    world.setComponent(otherPlayer, "inventory", createInventory(otherPlayer, `inventory:${otherPlayer}`, 28));
    world.setComponent(otherPlayer, "vars", { entityId: otherPlayer, values: {} });

    const playerInventory = world.getComponent(PLAYER, "inventory");
    const otherInventory = world.getComponent(otherPlayer, "inventory");
    expect(playerInventory).toBeDefined();
    expect(otherInventory).toBeDefined();
    if (!playerInventory || !otherInventory) return;
    addItem(playerInventory, catalogFromItems(ITEMS), "wood", 10);
    addItem(otherInventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 10 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);
    contributeToPublicWork(ctx, otherPlayer, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const publicWork = world.getComponent(PUBLIC_WORK_ENTITY, "publicWork");
    expect(publicWork?.contributors).toHaveLength(2);
    expect(publicWork?.contributors[0]).toMatchObject({ playerId: PLAYER, itemId: "wood", quantity: 5 });
    expect(publicWork?.contributors[1]).toMatchObject({ playerId: otherPlayer, itemId: "wood", quantity: 5 });
  });
});

describe("public work reward distribution", () => {
  it("distributes item rewards to contributors on completion", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
      [{ itemId: "coin", quantity: 100 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const updatedInventory = world.getComponent(PLAYER, "inventory");
    const coinSlot = updatedInventory?.slots.find((slot) => slot?.itemId === "coin");
    expect(coinSlot?.quantity).toBe(100);
  });

  it("distributes XP rewards to contributors on completion", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
      [],
      [{ skillId: "attack", amount: 50 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);
  });

  it("does not distribute item rewards when inventory is full", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    // Fill inventory completely with unstackable items (leave 1 slot for wood)
    for (let i = 0; i < 27; i += 1) {
      addItem(inventory, catalogFromItems(ctx.registries.item), "reward_badge", 1);
    }

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
      [{ itemId: "reward_badge", quantity: 2 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const updatedInventory = world.getComponent(PLAYER, "inventory");
    const rewardBadgeSlot = updatedInventory?.slots.find((slot) => slot?.itemId === "reward_badge");
    // Should still have only 27 reward badges (1 slot freed by wood contribution, but 2 badges needed)
    expect(count(updatedInventory!, "reward_badge")).toBe(27);
  });

  it("distributes rewards to all contributors", () => {
    const { world, ctx } = setup();
    const otherPlayer = world.createEntity();
    world.setComponent(otherPlayer, "inventory", createInventory(otherPlayer, `inventory:${otherPlayer}`, 28));
    world.setComponent(otherPlayer, "skills", {
      entityId: otherPlayer,
      skills: { attack: { level: 1, xp: 0, boost: 0, drain: 0 } },
    });
    world.setComponent(otherPlayer, "vars", { entityId: otherPlayer, values: {} });

    const playerInventory = world.getComponent(PLAYER, "inventory");
    const otherInventory = world.getComponent(otherPlayer, "inventory");
    expect(playerInventory).toBeDefined();
    expect(otherInventory).toBeDefined();
    if (!playerInventory || !otherInventory) return;
    addItem(playerInventory, catalogFromItems(ITEMS), "wood", 10);
    addItem(otherInventory, catalogFromItems(ITEMS), "wood", 10);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 10 }],
      [{ itemId: "coin", quantity: 100 }],
      [{ skillId: "attack", amount: 50 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);
    contributeToPublicWork(ctx, otherPlayer, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const playerCoins = world.getComponent(PLAYER, "inventory")?.slots.find((s) => s?.itemId === "coin");
    const otherCoins = world.getComponent(otherPlayer, "inventory")?.slots.find((s) => s?.itemId === "coin");
    expect(playerCoins?.quantity).toBe(100);
    expect(otherCoins?.quantity).toBe(100);

    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);
    expect(world.getComponent(otherPlayer, "skills")?.skills.attack?.xp).toBe(50);
  });

  it("records item audit for reward distribution", () => {
    const { world, ctx, itemAudit } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
      [{ itemId: "coin", quantity: 100 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    const audit = itemAudit.snapshot();
    const rewardAudit = audit.filter((r) => r.reason === "public_work_reward");
    expect(rewardAudit).toHaveLength(1);
    expect(rewardAudit[0]).toMatchObject({
      itemId: "coin",
      quantity: 100,
      reason: "public_work_reward",
    });
  });

  it("is idempotent — does not distribute rewards twice", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ITEMS), "wood", 5);

    createPublicWork(
      world,
      PUBLIC_WORK_ENTITY,
      "town_well",
      "Town Well",
      [{ itemId: "wood", quantity: 5 }],
      [{ itemId: "coin", quantity: 100 }],
      [{ skillId: "attack", amount: 50 }],
    );

    contributeToPublicWork(ctx, PLAYER, PUBLIC_WORK_ENTITY, "wood", 5, TICK, SERVER_TIME);

    // First completion already applied rewards
    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);

    // Second manual call should be idempotent (returns false because already distributed)
    const result = distributePublicWorkRewards(ctx, PUBLIC_WORK_ENTITY, SERVER_TIME, TICK);
    expect(result).toBe(false);

    // Verify XP and coins were only applied once
    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);
    const updatedInventory = world.getComponent(PLAYER, "inventory");
    const coinSlot = updatedInventory?.slots.find((s) => s?.itemId === "coin");
    expect(coinSlot?.quantity).toBe(100);
  });
});

import type { ItemDef, ShopDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleShopIntent, processShopRestockPhase, type ShopSystemContext } from "./shop-system";

const COIN: ItemDef = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "Currency.",
  icon: "icon_coin",
  value: 1,
  options: [],
  tags: [],
};

const BLADE: ItemDef = {
  id: "test_blade",
  name: "Test Blade",
  stackable: false,
  tradeable: true,
  examine: "A sharp blade.",
  icon: "icon_blade",
  value: 10,
  options: [],
  tags: [],
};

const SHOP_DEF: ShopDef = {
  id: "test_merchant",
  name: "Test Shop",
  stock: [
    { itemId: "test_blade", quantity: 5, maxQuantity: 10, price: 20, restockRate: 1 },
    { itemId: "coin", quantity: 100, maxQuantity: 1000, price: 1, restockRate: 10 },
  ],
  currency: "coin",
  sellMultiplier: 0.6,
  buyMultiplier: 1.0,
  restockTicks: 100,
  buyPolicy: "always",
  sellPolicy: "does_not_buy",
};

const ITEMS = new Map([COIN, BLADE].map((d) => [d.id, d]));

function getShop(
  world: ReturnType<typeof setup>["world"],
  npc: import("@old-town/shared").EntityId,
) {
  const shop = world.getComponent(npc, "shop");
  if (!shop) throw new Error("Shop component missing");
  return shop;
}

function getNpc(
  world: ReturnType<typeof setup>["world"],
  npc: import("@old-town/shared").EntityId,
) {
  const npcComp = world.getComponent(npc, "npc");
  if (!npcComp) throw new Error("NPC component missing");
  return npcComp;
}

function getStockEntry(shop: ReturnType<typeof getShop>, index: number) {
  const entry = shop.stock[index];
  if (!entry) throw new Error(`Stock entry ${index} missing`);
  return entry;
}

function setup(inventorySeed: readonly { itemId: string; quantity: number }[] = []) {
  const world = createWorld();
  const owner = world.createEntity();
  const npc = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 30, y: 30, plane: 0 });
  world.setComponent(npc, "position", { entityId: npc, x: 30, y: 31, plane: 0 });
  world.setComponent(npc, "npc", {
    entityId: npc,
    npcId: "test_merchant",
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: 0,
  });

  const catalog = catalogFromItems(ITEMS);
  for (const { itemId, quantity } of inventorySeed) {
    addItem(inventory, catalog, itemId, quantity);
  }

  const registries = makeRegistries({
    item: ITEMS,
    shop: new Map([[SHOP_DEF.id, SHOP_DEF]]),
    npc: new Map([
      [
        "test_merchant",
        {
          id: "test_merchant",
          name: "Test Merchant",
          size: 1,
          combatLevel: 1,
          maxHp: 10,
          stats: {
            attack: 1,
            strength: 1,
            defence: 1,
            ranged: 1,
            magic: 1,
            prayer: 1,
            hitpoints: 10,
          },
          attackSpeedTicks: 5,
          attackRangeTiles: 1,
          wanderRadius: 0,
          respawnTicks: 10,
          options: [{ label: "Trade", actionId: "trade", priority: 0, requiredDistance: 1 }],
          dialogueId: undefined,
          drops: undefined,
          examine: "A merchant.",
          movementType: "static" as const,
          aggressionMode: "peaceful" as const,
          contractEligible: false,
        },
      ],
    ]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const map = createRuntimeMap();
  const collision = new CollisionMap(map);

  const ctx: ShopSystemContext = {
    world,
    collision,
    deltas,
    registries,
    itemAudit,
  };

  return { world, owner, npc, inventory, deltas, itemAudit, ctx, catalog };
}

const TICK = 100;
const SERVER_TIME = 1_000;

describe("handleShopIntent — open", () => {
  it("opens the shop interface and sends shop view", () => {
    const { ctx, owner, npc } = setup();

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "open", targetEntityId: npc },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    const packet = ctx.deltas.peek();
    expect(packet.interfaceOpens).toHaveLength(1);
    expect(packet.interfaceOpens?.[0]?.interfaceId).toBe("shop");
    expect(packet.interfaceOpens?.[0]?.shop).toBeDefined();
    expect(packet.interfaceOpens?.[0]?.shop?.shopId).toBe("test_merchant");
    expect(packet.interfaceOpens?.[0]?.shop?.stock).toHaveLength(2);
  });

  it("creates a shop component on the NPC if one does not exist", () => {
    const { ctx, npc } = setup();

    expect(ctx.world.getComponent(npc, "shop")).toBeUndefined();

    handleShopIntent(
      ctx,
      getNpc(ctx.world, npc).entityId,
      { action: "open", targetEntityId: npc },
      TICK,
      SERVER_TIME,
    );

    expect(ctx.world.getComponent(npc, "shop")).toBeDefined();
  });

  it("rejects open when too far from target", () => {
    const { ctx, owner, npc } = setup();
    ctx.world.setComponent(owner, "position", { entityId: owner, x: 0, y: 0, plane: 0 });

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "open", targetEntityId: npc },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You are too far away from the shop.");
    expect(ctx.deltas.peek().interfaceOpens).toBeUndefined();
  });

  it("rejects open when target has no shop", () => {
    const { ctx, owner } = setup();
    const noShopNpc = ctx.world.createEntity();
    ctx.world.setComponent(noShopNpc, "position", { entityId: noShopNpc, x: 30, y: 31, plane: 0 });
    ctx.world.setComponent(noShopNpc, "npc", {
      entityId: noShopNpc,
      npcId: "no_shop_npc",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 0,
    });

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "open", targetEntityId: noShopNpc },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("This NPC does not run a shop.");
  });
});

describe("handleShopIntent — buy", () => {
  it("buys an item and deducts currency", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "coin", quantity: 100 }]);

    // Open shop first to create shop component
    const { npc } = setup([{ itemId: "coin", quantity: 100 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(80); // 100 - 20
    expect(count(inventory, "test_blade")).toBe(1);

    const packet = ctx.deltas.peek();
    expect(packet.inventoryDeltas).toHaveLength(1);
    expect(packet.interfaceOpens).toHaveLength(1); // shop refresh
  });

  it("rejects buy when out of stock", () => {
    const { ctx, owner } = setup([{ itemId: "coin", quantity: 100 }]);
    const { npc } = setup([{ itemId: "coin", quantity: 100 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    // Buy all 5 blades
    handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "test_blade", quantity: 5 },
      TICK,
      SERVER_TIME,
    );
    ctx.deltas.consume(0, 0);

    // Try to buy one more
    const result = handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("The shop is out of stock.");
  });

  it("rejects buy when insufficient currency", () => {
    const { ctx, owner } = setup([{ itemId: "coin", quantity: 10 }]);
    const { npc } = setup([{ itemId: "coin", quantity: 10 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You don't have enough coins.");
  });

  it("rejects buy when inventory is full", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "coin", quantity: 1000 }]);
    for (let i = 1; i < inventory.capacity; i++) {
      inventory.slots[i] = { itemId: "test_blade", quantity: 1, uid: 100 + i };
    }

    const { npc } = setup([{ itemId: "coin", quantity: 1000 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("Your inventory is full.");
  });

  it("rejects buy for item not in shop", () => {
    const { ctx, owner } = setup([{ itemId: "coin", quantity: 100 }]);
    const { npc } = setup([{ itemId: "coin", quantity: 100 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "nonexistent", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("This item is not sold here.");
  });

  it("records item audit for buy", () => {
    const { ctx, owner, itemAudit } = setup([{ itemId: "coin", quantity: 100 }]);
    const { npc } = setup([{ itemId: "coin", quantity: 100 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    handleShopIntent(
      ctx,
      owner,
      { action: "buy", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    const records = itemAudit.recent();
    expect(records.length).toBeGreaterThan(0);
    expect(records[records.length - 1]?.reason).toBe("shop_buy");
  });
});

describe("handleShopIntent — sell", () => {
  it("sells an item and adds currency", () => {
    const { ctx, owner, inventory } = setup([
      { itemId: "test_blade", quantity: 1 },
      { itemId: "coin", quantity: 0 },
    ]);
    const { npc } = setup([
      { itemId: "test_blade", quantity: 1 },
      { itemId: "coin", quantity: 0 },
    ]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "sell", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "test_blade")).toBe(0);
    expect(count(inventory, "coin")).toBe(12); // 20 * 0.6 = 12

    const packet = ctx.deltas.peek();
    expect(packet.inventoryDeltas).toHaveLength(1);
    expect(packet.interfaceOpens).toHaveLength(1); // shop refresh
  });

  it("rejects sell when shop isn't interested", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "coin", quantity: 10 }]);
    // Add a non-shop item to inventory
    inventory.slots[1] = { itemId: "unwanted_item", quantity: 1, uid: 999 };
    const { npc } = setup([{ itemId: "coin", quantity: 10 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "sell", itemId: "unwanted_item", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("The shop isn't interested in that.");
  });

  it("rejects sell when player doesn't have enough items", () => {
    const { ctx, owner } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const { npc } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    const result = handleShopIntent(
      ctx,
      owner,
      { action: "sell", itemId: "test_blade", quantity: 5 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You don't have enough items to sell.");
  });

  it("records item audit for sell", () => {
    const { ctx, owner, itemAudit } = setup([
      { itemId: "test_blade", quantity: 1 },
      { itemId: "coin", quantity: 0 },
    ]);
    const { npc } = setup([
      { itemId: "test_blade", quantity: 1 },
      { itemId: "coin", quantity: 0 },
    ]);
    const shopNpc = npc;
    handleShopIntent(ctx, owner, { action: "open", targetEntityId: shopNpc }, TICK, SERVER_TIME);
    ctx.deltas.consume(0, 0);

    handleShopIntent(
      ctx,
      owner,
      { action: "sell", itemId: "test_blade", quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    const records = itemAudit.recent();
    expect(records.length).toBeGreaterThan(0);
    expect(records[records.length - 1]?.reason).toBe("shop_sell");
  });
});

describe("handleShopIntent — close", () => {
  it("closes the shop interface", () => {
    const { ctx, owner } = setup();

    const result = handleShopIntent(ctx, owner, { action: "close" }, TICK, SERVER_TIME);

    expect(result).toBe(true);
    expect(ctx.deltas.peek().interfaceCloses).toEqual([{ interfaceId: "shop" }]);
  });
});

describe("processShopRestockPhase", () => {
  it("restocks shop items when restock interval has passed", () => {
    const { ctx, npc } = setup();

    // Create shop component
    handleShopIntent(
      ctx,
      getNpc(ctx.world, npc).entityId,
      { action: "open", targetEntityId: npc },
      TICK,
      SERVER_TIME,
    );
    const shop = getShop(ctx.world, npc);
    getStockEntry(shop, 0).quantity = 0; // Deplete blades
    shop.lastRestockTick = 0;
    ctx.world.setComponent(npc, "shop", shop);

    processShopRestockPhase(ctx, 200); // 200 - 0 = 200 >= 100

    const updatedShop = getShop(ctx.world, npc);
    expect(getStockEntry(updatedShop, 0).quantity).toBe(1); // restocked by 1
    expect(updatedShop.lastRestockTick).toBe(200);
  });

  it("does not restock before interval has passed", () => {
    const { ctx, npc } = setup();

    handleShopIntent(
      ctx,
      getNpc(ctx.world, npc).entityId,
      { action: "open", targetEntityId: npc },
      TICK,
      SERVER_TIME,
    );
    const shop = getShop(ctx.world, npc);
    getStockEntry(shop, 0).quantity = 0;
    shop.lastRestockTick = 150;
    ctx.world.setComponent(npc, "shop", shop);

    processShopRestockPhase(ctx, 200); // 200 - 150 = 50 < 100

    const updatedShop = getShop(ctx.world, npc);
    expect(getStockEntry(updatedShop, 0).quantity).toBe(0); // not restocked
    expect(updatedShop.lastRestockTick).toBe(150);
  });

  it("caps restock at maxQuantity", () => {
    const { ctx, npc } = setup();

    handleShopIntent(
      ctx,
      getNpc(ctx.world, npc).entityId,
      { action: "open", targetEntityId: npc },
      TICK,
      SERVER_TIME,
    );
    const shop = getShop(ctx.world, npc);
    getStockEntry(shop, 0).quantity = 9; // 1 below max
    shop.lastRestockTick = 0;
    ctx.world.setComponent(npc, "shop", shop);

    processShopRestockPhase(ctx, 200);

    const updatedShop = getShop(ctx.world, npc);
    expect(getStockEntry(updatedShop, 0).quantity).toBe(10); // capped at max
  });
});

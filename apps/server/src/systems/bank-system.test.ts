import type { BankDef, ItemDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleBankIntent, type BankSystemContext } from "./bank-system";

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

const BANK_DEF: BankDef = {
  id: "old_town_bank",
  name: "Old Town Bank",
  location: { plane: 0, tileX: 30, tileY: 30 },
  capacity: 400,
  tabs: true,
  feePerItem: 0,
};

const ITEMS = new Map([COIN, BLADE].map((d) => [d.id, d]));

function setup(inventorySeed: readonly { itemId: string; quantity: number }[] = []) {
  const world = createWorld();
  const owner = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 30, y: 30, plane: 0 });

  const catalog = catalogFromItems(ITEMS);
  for (const { itemId, quantity } of inventorySeed) {
    addItem(inventory, catalog, itemId, quantity);
  }

  const registries = makeRegistries({
    item: ITEMS,
    bank: new Map([[BANK_DEF.id, BANK_DEF]]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const map = createRuntimeMap();
  const collision = new CollisionMap(map);

  const ctx: BankSystemContext = {
    world,
    collision,
    deltas,
    registries,
    itemAudit,
  };

  return { world, owner, inventory, deltas, itemAudit, ctx, catalog };
}

const TICK = 100;
const SERVER_TIME = 1_000;

function uidOf(inventory: ReturnType<typeof setup>["inventory"], slot = 0): number {
  return inventory.slots[slot]?.uid ?? 0;
}

describe("handleBankIntent — open", () => {
  it("opens the bank interface and sends bank inventory delta", () => {
    const { ctx, owner } = setup();

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "open" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().interfaceOpens).toEqual([{ interfaceId: "bank" }]);
    expect(ctx.deltas.peek().inventoryDeltas?.[0]?.containerId).toBe("bank");
  });

  it("creates a bank component if one does not exist", () => {
    const { ctx, owner, world } = setup();

    expect(world.getComponent(owner, "bank")).toBeUndefined();

    handleBankIntent(ctx, owner, { action: "open" }, TICK, SERVER_TIME);

    expect(world.getComponent(owner, "bank")).toBeDefined();
  });
});

describe("handleBankIntent — close", () => {
  it("closes the bank interface", () => {
    const { ctx, owner } = setup();

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "close" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().interfaceCloses).toEqual([{ interfaceId: "bank" }]);
  });
});

describe("handleBankIntent — deposit", () => {
  it("moves a stackable item from inventory to bank", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "coin", quantity: 5 }]);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "deposit", itemUid: uidOf(inventory), quantity: 3 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(2);

    const bank = ctx.world.getComponent(owner, "bank");
    expect(bank).toBeDefined();
    if (bank) expect(count(bank, "coin")).toBe(3);

    const deltas = ctx.deltas.peek().inventoryDeltas ?? [];
    expect(deltas).toHaveLength(2);
    const inventoryDelta = deltas.find((d) => d.containerId === `inventory:${owner}`);
    const bankDelta = deltas.find((d) => d.containerId === "bank");
    expect(inventoryDelta).toBeDefined();
    expect(bankDelta).toBeDefined();
  });

  it("moves an unstackable item from inventory to bank", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "test_blade", quantity: 1 }]);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "deposit", itemUid: uidOf(inventory), quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "test_blade")).toBe(0);

    const bank = ctx.world.getComponent(owner, "bank");
    if (bank) expect(count(bank, "test_blade")).toBe(1);
  });

  it("rejects deposit with invalid quantity", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "coin", quantity: 5 }]);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "deposit", itemUid: uidOf(inventory), quantity: 0 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(5);
  });

  it("rejects deposit when item uid is not found", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "coin", quantity: 5 }]);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "deposit", itemUid: 999, quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(5);
    expect(ctx.deltas.peek().chat?.[0]).toMatchObject({
      channel: "system",
      text: "Item not found in inventory.",
    });
  });

  it("fails deposit when bank is full and rolls back", () => {
    const { ctx, owner, inventory } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const bank = ctx.world.getComponent(owner, "bank");
    // If bank doesn't exist yet, create it and fill it
    if (!bank) {
      const newBank = createInventory(owner, "bank", 1);
      newBank.slots[0] = { itemId: "coin", quantity: 1, uid: 1 };
      ctx.world.setComponent(owner, "bank", newBank as unknown as import("../ecs/components").BankComponent);
    }

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "deposit", itemUid: uidOf(inventory), quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "test_blade")).toBe(1); // rolled back
    expect(ctx.deltas.peek().chat?.[0]).toMatchObject({
      channel: "system",
      text: "Your bank is full.",
    });
  });
});

describe("handleBankIntent — withdraw", () => {
  it("moves a stackable item from bank to inventory", () => {
    const { ctx, owner, inventory } = setup();
    const bank = createInventory(owner, "bank", 400);
    addItem(bank, catalogFromItems(ITEMS), "coin", 10);
    ctx.world.setComponent(owner, "bank", bank as unknown as import("../ecs/components").BankComponent);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "withdraw", itemUid: uidOf(bank), quantity: 5 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(5);
    expect(count(bank, "coin")).toBe(5);

    const deltas = ctx.deltas.peek().inventoryDeltas ?? [];
    expect(deltas).toHaveLength(2);
  });

  it("moves an unstackable item from bank to inventory", () => {
    const { ctx, owner, inventory } = setup();
    const bank = createInventory(owner, "bank", 400);
    addItem(bank, catalogFromItems(ITEMS), "test_blade", 1);
    ctx.world.setComponent(owner, "bank", bank as unknown as import("../ecs/components").BankComponent);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "withdraw", itemUid: uidOf(bank), quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "test_blade")).toBe(1);
    expect(count(bank, "test_blade")).toBe(0);
  });

  it("rejects withdraw when inventory is full", () => {
    const { ctx, owner, inventory } = setup();
    // Fill inventory
    for (let i = 0; i < inventory.capacity; i++) {
      inventory.slots[i] = { itemId: "coin", quantity: 1, uid: 100 + i };
    }

    const bank = createInventory(owner, "bank", 400);
    addItem(bank, catalogFromItems(ITEMS), "test_blade", 1);
    ctx.world.setComponent(owner, "bank", bank as unknown as import("../ecs/components").BankComponent);

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "withdraw", itemUid: uidOf(bank), quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(bank, "test_blade")).toBe(1); // still in bank
    expect(ctx.deltas.peek().chat?.[0]).toMatchObject({
      channel: "system",
      text: "Your inventory is full.",
    });
  });

  it("rejects withdraw when item uid is not in bank", () => {
    const { ctx, owner } = setup();

    const result = handleBankIntent(
      ctx,
      owner,
      { action: "withdraw", itemUid: 999, quantity: 1 },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]).toMatchObject({
      channel: "system",
      text: "Item not found in bank.",
    });
  });
});

describe("handleBankIntent — bank capacity", () => {
  it("creates bank with capacity from registry definition", () => {
    const { ctx, owner } = setup();

    handleBankIntent(ctx, owner, { action: "open" }, TICK, SERVER_TIME);

    const bank = ctx.world.getComponent(owner, "bank");
    expect(bank).toBeDefined();
    if (bank) expect(bank.capacity).toBe(400);
  });
});

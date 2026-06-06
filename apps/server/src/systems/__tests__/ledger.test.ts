import type { ItemDef, PropertyDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../../items/inventory";
import { ItemAuditLog } from "../../items/item-audit";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import {
  createDeed,
  DEED_ITEM_ID,
  type LedgerSystemContext,
  processDeedExpiry,
  redeemDeed,
  transferDeed,
} from "../ledger-system";

const LEDGER_DEED: ItemDef = {
  id: DEED_ITEM_ID,
  name: "Ledger Deed",
  stackable: false,
  tradeable: true,
  examine: "A legal deed to property.",
  icon: "icon_deed",
  value: 100,
  options: [],
  tags: [],
};

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

const MARKET_STALL: PropertyDef = {
  id: "old_town_market_stall",
  name: "Old Town Market Stall",
  maxOwners: 1,
  transferable: true,
  expiryTicks: 0,
};

const TEMP_BOOTH: PropertyDef = {
  id: "temp_booth",
  name: "Temporary Booth",
  maxOwners: 1,
  transferable: false,
  expiryTicks: 10,
};

const ITEMS = new Map([LEDGER_DEED, COIN].map((d) => [d.id, d]));

function setup(inventorySeed: readonly { itemId: string; quantity: number }[] = []) {
  const world = createWorld();
  const owner = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 1, y: 1, plane: 0 });
  world.setComponent(owner, "vars", { entityId: owner, values: {} });

  const catalog = catalogFromItems(ITEMS);
  for (const { itemId, quantity } of inventorySeed) {
    addItem(inventory, catalog, itemId, quantity);
  }

  const registries = makeRegistries({
    item: ITEMS,
    property: new Map([
      [MARKET_STALL.id, MARKET_STALL],
      [TEMP_BOOTH.id, TEMP_BOOTH],
    ]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();

  const ctx: LedgerSystemContext = {
    world,
    deltas,
    registries,
    itemAudit,
  };

  return { world, owner, inventory, deltas, itemAudit, ctx, catalog };
}

const TICK = 100;
const SERVER_TIME = 1_000;

describe("createDeed", () => {
  it("creates a deed for a valid property and adds deed item to inventory", () => {
    const { ctx, owner, inventory } = setup();

    const result = createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(true);
    expect(count(inventory, DEED_ITEM_ID)).toBe(1);

    const deedComponent = ctx.world.getComponent(owner, "deed");
    expect(deedComponent).toBeDefined();
    expect(deedComponent?.deeds).toHaveLength(1);
    expect(deedComponent?.deeds[0]).toMatchObject({
      propertyId: MARKET_STALL.id,
      ownerId: owner,
      issuedTick: TICK,
      expiryTick: 0,
      transferable: true,
    });

    expect(ctx.deltas.peek().inventoryDeltas?.[0]?.changes).toEqual([
      expect.objectContaining({ itemId: DEED_ITEM_ID, quantity: 1 }),
    ]);
  });

  it("rejects creation for a missing property", () => {
    const { ctx, owner } = setup();

    const result = createDeed(ctx, owner, "missing_property", TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("That property does not exist.");
  });

  it("rejects duplicate deeds for the same property", () => {
    const { ctx, owner } = setup();

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);
    const result = createDeed(ctx, owner, MARKET_STALL.id, TICK + 1, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.at(-1)?.text).toBe("You already hold a deed for that property.");
  });

  it("rejects creation when inventory is full", () => {
    const { ctx, owner, inventory } = setup();
    for (let i = 0; i < inventory.capacity; i++) {
      inventory.slots[i] = { itemId: "coin", quantity: 1, uid: 100 + i };
    }

    const result = createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("Your inventory is full.");
  });

  it("uses custom expiry tick when provided", () => {
    const { ctx, owner } = setup();

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME, 500);

    const deedComponent = ctx.world.getComponent(owner, "deed");
    expect(deedComponent?.deeds[0]?.expiryTick).toBe(500);
  });

  it("uses property default expiry when not provided", () => {
    const { ctx, owner } = setup();

    createDeed(ctx, owner, TEMP_BOOTH.id, TICK, SERVER_TIME);

    const deedComponent = ctx.world.getComponent(owner, "deed");
    expect(deedComponent?.deeds[0]?.expiryTick).toBe(10);
    expect(deedComponent?.deeds[0]?.transferable).toBe(false);
  });

  it("records item audit for deed creation", () => {
    const { ctx, owner, itemAudit } = setup();

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);

    const audit = itemAudit.snapshot();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      reason: "deed_create",
      itemId: DEED_ITEM_ID,
      quantity: 1,
      beforeQuantity: 0,
      afterQuantity: 1,
    });
  });
});

describe("transferDeed", () => {
  it("transfers a deed and updates owner", () => {
    const { ctx, world, owner, inventory } = setup();
    const other = world.createEntity();
    const otherInventory = createInventory(other, `inventory:${other}`, 28);
    world.setComponent(other, "inventory", otherInventory);
    world.setComponent(other, "vars", { entityId: other, values: {} });

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);
    ctx.deltas.consume(TICK, SERVER_TIME);

    const result = transferDeed(ctx, owner, other, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(true);
    expect(count(inventory, DEED_ITEM_ID)).toBe(0);
    expect(count(otherInventory, DEED_ITEM_ID)).toBe(1);

    const ownerDeeds = ctx.world.getComponent(owner, "deed");
    expect(ownerDeeds?.deeds).toHaveLength(0);

    const otherDeeds = ctx.world.getComponent(other, "deed");
    expect(otherDeeds?.deeds).toHaveLength(1);
    expect(otherDeeds?.deeds[0]?.ownerId).toBe(other);
  });

  it("rejects transfer when source does not hold the deed", () => {
    const { ctx, world, owner } = setup();
    const other = world.createEntity();
    const otherInventory = createInventory(other, `inventory:${other}`, 28);
    world.setComponent(other, "inventory", otherInventory);
    world.setComponent(other, "vars", { entityId: other, values: {} });

    const result = transferDeed(ctx, owner, other, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You do not hold any deeds.");
  });

  it("rejects transfer for non-transferable deeds", () => {
    const { ctx, world, owner } = setup();
    const other = world.createEntity();
    const otherInventory = createInventory(other, `inventory:${other}`, 28);
    world.setComponent(other, "inventory", otherInventory);
    world.setComponent(other, "vars", { entityId: other, values: {} });

    createDeed(ctx, owner, TEMP_BOOTH.id, TICK, SERVER_TIME);
    ctx.deltas.consume(TICK, SERVER_TIME);
    const result = transferDeed(ctx, owner, other, TEMP_BOOTH.id, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("This deed is not transferable.");
  });

  it("rejects transfer when target inventory is full", () => {
    const { ctx, world, owner, inventory } = setup();
    const other = world.createEntity();
    const otherInventory = createInventory(other, `inventory:${other}`, 28);
    for (let i = 0; i < otherInventory.capacity; i++) {
      otherInventory.slots[i] = { itemId: "coin", quantity: 1, uid: 200 + i };
    }
    world.setComponent(other, "inventory", otherInventory);
    world.setComponent(other, "vars", { entityId: other, values: {} });

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);
    ctx.deltas.consume(TICK, SERVER_TIME);
    const result = transferDeed(ctx, owner, other, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("Your inventory is full.");
    expect(count(inventory, DEED_ITEM_ID)).toBe(1);
  });

  it("records item audit for both parties", () => {
    const { ctx, world, owner, itemAudit } = setup();
    const other = world.createEntity();
    const otherInventory = createInventory(other, `inventory:${other}`, 28);
    world.setComponent(other, "inventory", otherInventory);
    world.setComponent(other, "vars", { entityId: other, values: {} });

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);
    itemAudit.snapshot(); // clear prior
    transferDeed(ctx, owner, other, MARKET_STALL.id, TICK, SERVER_TIME);

    const audit = itemAudit.snapshot();
    const transferOut = audit.find((r) => r.reason === "deed_transfer_out");
    const transferIn = audit.find((r) => r.reason === "deed_transfer_in");
    expect(transferOut).toBeDefined();
    expect(transferIn).toBeDefined();
    expect(transferOut?.beforeQuantity).toBe(1);
    expect(transferOut?.afterQuantity).toBe(0);
    expect(transferIn?.beforeQuantity).toBe(0);
    expect(transferIn?.afterQuantity).toBe(1);
  });
});

describe("redeemDeed", () => {
  it("redeems a deed, removes item, and grants property rights", () => {
    const { ctx, owner, inventory } = setup();

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);
    ctx.deltas.consume(TICK, SERVER_TIME);

    const result = redeemDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(true);
    expect(count(inventory, DEED_ITEM_ID)).toBe(0);

    const deedComponent = ctx.world.getComponent(owner, "deed");
    expect(deedComponent?.deeds).toHaveLength(0);

    const vars = ctx.world.getComponent(owner, "vars");
    expect(vars?.values[`property.${MARKET_STALL.id}.owner`]).toBe(owner);
  });

  it("rejects redemption when no deed is held", () => {
    const { ctx, owner } = setup();

    const result = redeemDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);

    expect(result).toBe(false);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You do not hold any deeds.");
  });

  it("records item audit for redemption", () => {
    const { ctx, owner, itemAudit } = setup();

    createDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);
    redeemDeed(ctx, owner, MARKET_STALL.id, TICK, SERVER_TIME);

    const audit = itemAudit.snapshot();
    const redeemAudit = audit.at(-1);
    expect(redeemAudit).toMatchObject({
      reason: "deed_redeem",
      itemId: DEED_ITEM_ID,
      quantity: 1,
      beforeQuantity: 1,
      afterQuantity: 0,
    });
  });
});

describe("processDeedExpiry", () => {
  it("removes expired deeds and items", () => {
    const { ctx, owner, inventory } = setup();

    createDeed(ctx, owner, TEMP_BOOTH.id, 0, SERVER_TIME);
    expect(count(inventory, DEED_ITEM_ID)).toBe(1);
    ctx.deltas.consume(0, SERVER_TIME);

    processDeedExpiry(ctx, 15, SERVER_TIME);

    expect(count(inventory, DEED_ITEM_ID)).toBe(0);
    const deedComponent = ctx.world.getComponent(owner, "deed");
    expect(deedComponent?.deeds).toHaveLength(0);
    expect(ctx.deltas.peek().chat?.[0]?.text).toContain("expired");
  });

  it("does not remove unexpired deeds", () => {
    const { ctx, owner, inventory } = setup();

    createDeed(ctx, owner, MARKET_STALL.id, 0, SERVER_TIME);

    processDeedExpiry(ctx, 999, SERVER_TIME);

    expect(count(inventory, DEED_ITEM_ID)).toBe(1);
    const deedComponent = ctx.world.getComponent(owner, "deed");
    expect(deedComponent?.deeds).toHaveLength(1);
  });

  it("clears property rights on expiry when owner held rights", () => {
    const { ctx, owner, inventory } = setup();

    createDeed(ctx, owner, TEMP_BOOTH.id, 0, SERVER_TIME);
    redeemDeed(ctx, owner, TEMP_BOOTH.id, 0, SERVER_TIME);
    // Restore the deed item for expiry test (simulate it being reissued)
    addItem(inventory, catalogFromItems(ITEMS), DEED_ITEM_ID, 1);
    const deedComponent = ctx.world.getComponent(owner, "deed");
    if (deedComponent) {
      deedComponent.deeds.push({
        id: "temp",
        propertyId: TEMP_BOOTH.id,
        ownerId: owner,
        issuedTick: 0,
        expiryTick: 10,
        transferable: true,
      });
      ctx.world.setComponent(owner, "deed", deedComponent);
    }

    processDeedExpiry(ctx, 15, SERVER_TIME);

    const vars = ctx.world.getComponent(owner, "vars");
    expect(vars?.values[`property.${TEMP_BOOTH.id}.owner`]).toBe("");
  });

  it("records item audit for expiry", () => {
    const { ctx, owner, itemAudit } = setup();

    createDeed(ctx, owner, TEMP_BOOTH.id, 0, SERVER_TIME);
    processDeedExpiry(ctx, 15, SERVER_TIME);

    const audit = itemAudit.snapshot();
    const expiryAudit = audit.at(-1);
    expect(expiryAudit).toMatchObject({
      reason: "deed_expiry",
      itemId: DEED_ITEM_ID,
      quantity: 1,
    });
  });
});

import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  createDeed,
  DEED_ITEM_ID,
  processDeedExpiry,
  redeemDeed,
  transferDeed,
} from "./ledger-system";

const PROPERTY_DEF: import("@old-town/shared").PropertyDef = {
  id: "sootcellar_cell",
  name: "Sootcellar Cell",
  location: { tileX: 30, tileY: 26, plane: 0 },
  maxOwners: 1,
  transferable: true,
  expiryTicks: 0,
};

const DEED_ITEM = {
  id: "ledger_deed",
  name: "Ledger Deed",
  stackable: true,
  tradeable: true,
  examine: "A property deed.",
  icon: "icon_deed",
  value: 100,
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
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const registries = makeRegistries({
    property: new Map([[PROPERTY_DEF.id, PROPERTY_DEF]]),
    item: new Map([[DEED_ITEM.id, DEED_ITEM]]),
  });
  const ctx = {
    world,
    deltas,
    registries,
    itemAudit,
  };
  return { ctx, world, deltas, itemAudit };
}

describe("createDeed", () => {
  it("creates a deed for an existing property", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);

    const result = createDeed(ctx, player, "sootcellar_cell", 1, 0);

    expect(result).toBe(true);
    const deedComponent = world.getComponent(player, "deed");
    expect(deedComponent?.deeds.length).toBe(1);
    expect(deedComponent?.deeds[0]?.propertyId).toBe("sootcellar_cell");
  });

  it("fails when property does not exist", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);

    const result = createDeed(ctx, player, "nonexistent", 1, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("That property does not exist.");
  });

  it("fails when player already has a deed for the property", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    createDeed(ctx, player, "sootcellar_cell", 1, 0);
    deltas.consume(0, 0);

    const result = createDeed(ctx, player, "sootcellar_cell", 2, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You already hold a deed for that property.");
  });

  it("adds deed item to inventory", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);

    createDeed(ctx, player, "sootcellar_cell", 1, 0);

    const inventory = world.getComponent(player, "inventory");
    const deedSlot = inventory?.slots.find((s) => s?.itemId === DEED_ITEM_ID);
    expect(deedSlot?.quantity).toBe(1);
  });
});

describe("transferDeed", () => {
  it("transfers a deed from one player to another", () => {
    const { ctx, world } = setup();
    const from = addPlayer(world, 0, 0);
    const to = addPlayer(world, 1, 1);
    createDeed(ctx, from, "sootcellar_cell", 1, 0);

    const result = transferDeed(ctx, from, to, "sootcellar_cell", 2, 0);

    expect(result).toBe(true);
    const fromDeeds = world.getComponent(from, "deed");
    expect(fromDeeds?.deeds.length).toBe(0);
    const toDeeds = world.getComponent(to, "deed");
    expect(toDeeds?.deeds.length).toBe(1);
    expect(toDeeds?.deeds[0]?.propertyId).toBe("sootcellar_cell");
  });

  it("fails when source has no deed component", () => {
    const { ctx, world, deltas } = setup();
    const from = addPlayer(world, 0, 0);
    const to = addPlayer(world, 1, 1);

    const result = transferDeed(ctx, from, to, "sootcellar_cell", 2, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You do not hold any deeds.");
  });

  it("fails when deed is not transferable", () => {
    const { ctx, world } = setup();
    const from = addPlayer(world, 0, 0);
    const to = addPlayer(world, 1, 1);
    const nonTransferable = { ...PROPERTY_DEF, id: "locked_cell", transferable: false };
    const registriesWithLocked = makeRegistries({
      property: new Map([[nonTransferable.id, nonTransferable]]),
      item: new Map([[DEED_ITEM.id, DEED_ITEM]]),
    });
    const ctxWithLocked = { ...ctx, registries: registriesWithLocked };
    createDeed(ctxWithLocked, from, "locked_cell", 1, 0);
    ctxWithLocked.deltas.consume(0, 0);

    const result = transferDeed(ctxWithLocked, from, to, "locked_cell", 2, 0);

    expect(result).toBe(false);
    const state = ctxWithLocked.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("This deed is not transferable.");
  });
});

describe("redeemDeed", () => {
  it("redeems a deed and sets property owner", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    createDeed(ctx, player, "sootcellar_cell", 1, 0);
    deltas.consume(0, 0);

    const result = redeemDeed(ctx, player, "sootcellar_cell", 2, 0);

    expect(result).toBe(true);
    const vars = world.getComponent(player, "vars");
    expect(vars?.values["property.sootcellar_cell.owner"]).toBe(player);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe(
      "You redeem the deed for Sootcellar Cell. Property rights granted.",
    );
  });

  it("fails when player has no deed component", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);

    const result = redeemDeed(ctx, player, "sootcellar_cell", 2, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You do not hold any deeds.");
  });
});

describe("processDeedExpiry", () => {
  it("expires deeds that have passed their expiry tick", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0);
    const shortProperty = { ...PROPERTY_DEF, expiryTicks: 5 };
    const registriesWithShort = makeRegistries({
      property: new Map([[shortProperty.id, shortProperty]]),
      item: new Map([[DEED_ITEM.id, DEED_ITEM]]),
    });
    const ctxWithShort = { ...ctx, registries: registriesWithShort };
    createDeed(ctxWithShort, player, "sootcellar_cell", 1, 0);
    ctxWithShort.deltas.consume(0, 0);

    processDeedExpiry(ctxWithShort, 7, 0);

    const deedComponent = world.getComponent(player, "deed");
    expect(deedComponent?.deeds.length).toBe(0);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("Your deed for Sootcellar Cell has expired.");
  });

  it("does not expire permanent deeds", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);
    createDeed(ctx, player, "sootcellar_cell", 1, 0);

    processDeedExpiry(ctx, 999, 0);

    const deedComponent = world.getComponent(player, "deed");
    expect(deedComponent?.deeds.length).toBe(1);
  });
});

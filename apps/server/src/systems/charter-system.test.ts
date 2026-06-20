import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { hasPermit, issueCharter, processCharterExpiry, validateCharter } from "./charter-system";

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

const CHARTER_NO_COST: import("@old-town/shared").CharterDef = {
  id: "market_pass",
  name: "Market Pass",
  type: "area",
  requiredStanding: 0,
  duration: 0,
  cost: undefined,
};

const CHARTER_WITH_COST: import("@old-town/shared").CharterDef = {
  id: "smithing_charter",
  name: "Smithing Charter",
  type: "activity",
  requiredStanding: 5,
  duration: 10,
  cost: { itemId: "coin", quantity: 5 },
};

function addPlayer(
  world: World,
  x: number,
  y: number,
  standing = 0,
): import("@old-town/shared").EntityId {
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
    values: { standing },
  });
  return entityId;
}

function addCoins(
  world: World,
  entityId: import("@old-town/shared").EntityId,
  quantity: number,
): void {
  const inventory = world.getComponent(entityId, "inventory");
  expect(inventory).toBeDefined();
  if (!inventory) return;
  inventory.slots[0] = { itemId: "coin", quantity, uid: 1 };
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const registries = makeRegistries({
    charter: new Map([
      [CHARTER_NO_COST.id, CHARTER_NO_COST],
      [CHARTER_WITH_COST.id, CHARTER_WITH_COST],
    ]),
    item: new Map([[COIN_DEF.id, COIN_DEF]]),
  });
  const ctx = {
    world,
    deltas,
    registries,
    itemAudit,
  };
  return { ctx, world, deltas, itemAudit };
}

describe("issueCharter", () => {
  it("issues a free charter when requirements are met", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 0);

    const result = issueCharter(ctx, player, "market_pass", 1, 0);

    expect(result).toBe(true);
    expect(hasPermit(world, player, "market_pass", 1)).toBe(true);
  });

  it("fails when charter does not exist", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 0);

    const result = issueCharter(ctx, player, "nonexistent", 1, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("That charter does not exist.");
  });

  it("fails when standing requirement is not met", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 0);

    const result = issueCharter(ctx, player, "smithing_charter", 1, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need standing 5 to obtain this charter.");
  });

  it("fails when player already has the permit", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 5);
    addCoins(world, player, 10);
    issueCharter(ctx, player, "smithing_charter", 1, 0);
    deltas.consume(0, 0);
    const result = issueCharter(ctx, player, "smithing_charter", 2, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You already hold a permit for that charter.");
  });

  it("deducts cost when charter has a cost", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 5);
    addCoins(world, player, 10);

    const result = issueCharter(ctx, player, "smithing_charter", 1, 0);

    expect(result).toBe(true);
    const inventory = world.getComponent(player, "inventory");
    const slot = inventory?.slots[0];
    expect(slot?.quantity).toBe(5);
  });

  it("fails when player cannot afford cost", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 5);
    addCoins(world, player, 2);

    const result = issueCharter(ctx, player, "smithing_charter", 1, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You cannot afford this charter.");
  });

  it("records item audit for charter cost", () => {
    const { ctx, world, itemAudit } = setup();
    const player = addPlayer(world, 0, 0, 5);
    addCoins(world, player, 10);

    issueCharter(ctx, player, "smithing_charter", 1, 0);

    const logs = itemAudit.recent(10);
    expect(logs.length).toBe(1);
    expect(logs[0]).toMatchObject({
      itemId: "coin",
      quantity: 5,
      reason: "charter_cost",
      metadata: { charterId: "smithing_charter", actorEntityId: player },
    });
  });
});

describe("hasPermit", () => {
  it("returns true when player has valid permit", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 0);
    issueCharter(ctx, player, "market_pass", 1, 0);

    expect(hasPermit(world, player, "market_pass", 1)).toBe(true);
  });

  it("returns false when player has no charter component", () => {
    const { world } = setup();
    const player = addPlayer(world, 0, 0, 0);

    expect(hasPermit(world, player, "market_pass", 1)).toBe(false);
  });

  it("returns false when permit has expired", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 5);
    issueCharter(ctx, player, "smithing_charter", 1, 0);

    expect(hasPermit(world, player, "smithing_charter", 12)).toBe(false);
  });

  it("returns true for permanent permit (duration 0)", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 0);
    issueCharter(ctx, player, "market_pass", 1, 0);

    expect(hasPermit(world, player, "market_pass", 999)).toBe(true);
  });
});

describe("validateCharter", () => {
  it("returns true when player has valid permit", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 0);
    issueCharter(ctx, player, "market_pass", 1, 0);

    const result = validateCharter(ctx, player, "market_pass", 1, 0);
    expect(result).toBe(true);
  });

  it("returns false when charter does not exist", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 0);

    const result = validateCharter(ctx, player, "nonexistent", 1, 0);
    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("That charter does not exist.");
  });

  it("returns false when player lacks permit", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 0);

    const result = validateCharter(ctx, player, "market_pass", 1, 0);
    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need a permit: Market Pass.");
  });
});

describe("processCharterExpiry", () => {
  it("expires permits that have passed their expiry tick", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 5);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addCoins(world, player, 10);
    issueCharter(ctx, player, "smithing_charter", 1, 0);
    deltas.consume(0, 0);
    processCharterExpiry(ctx, 12, 0);

    expect(hasPermit(world, player, "smithing_charter", 12)).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("Your permit for Smithing Charter has expired.");
  });

  it("does not expire permanent permits", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0, 0);
    issueCharter(ctx, player, "market_pass", 1, 0);

    processCharterExpiry(ctx, 999, 0);

    expect(hasPermit(world, player, "market_pass", 999)).toBe(true);
  });

  it("does not send message for non-expired permits", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 0, 0, 5);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addCoins(world, player, 10);
    issueCharter(ctx, player, "smithing_charter", 1, 0);
    deltas.consume(0, 0);
    processCharterExpiry(ctx, 5, 0);

    expect(hasPermit(world, player, "smithing_charter", 5)).toBe(true);
    const state = deltas.peek();
    expect(state.chat).toBeUndefined();
  });
});

import type { CharterDef } from "@old-town/shared/content-schemas/charter";
import { describe, expect, it } from "vitest";
import { createWorld } from "../../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../../items/inventory";
import { ItemAuditLog } from "../../items/item-audit";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import { setVar } from "../../vars/player-vars";
import { hasPermit, issueCharter, processCharterExpiry, validateCharter } from "../charter-system";

const PLAYER = 0 as import("@old-town/shared/types/ids").EntityId;

const COIN_DEF = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "A small copper coin.",
  icon: "icon_coin",
  value: 1,
  weight: 0.01,
  options: [],
  tags: ["currency"],
};

const CHARTER_AREA_DEF = {
  id: "oldroad_pass",
  name: "Oldroad Pass",
  type: "area" as const,
  requiredStanding: 10,
  cost: { itemId: "coin", quantity: 50 },
  duration: 100,
};

const CHARTER_ACTIVITY_DEF = {
  id: "fishing_license",
  name: "Fishing License",
  type: "activity" as const,
  requiredStanding: 0,
  cost: { itemId: "coin", quantity: 20 },
  duration: 0,
};

const CHARTER_CONTENT_DEF = {
  id: "ruin_access",
  name: "Ruin Access",
  type: "content" as const,
  requiredStanding: 5,
  duration: 50,
};

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);

  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "vars", { entityId: PLAYER, values: {} });

  const deltas = new DeltaAccumulator();
  const charterMap = new Map<string, CharterDef>([
    [CHARTER_AREA_DEF.id, CHARTER_AREA_DEF],
    [CHARTER_ACTIVITY_DEF.id, CHARTER_ACTIVITY_DEF],
    [CHARTER_CONTENT_DEF.id, CHARTER_CONTENT_DEF],
  ]);
  const registries = makeRegistries({
    item: new Map([[COIN_DEF.id, COIN_DEF]]),
    charter: charterMap,
  });

  const itemAudit = new ItemAuditLog();
  const ctx = { world, deltas, registries, itemAudit };
  return { world, deltas, ctx, registries };
}

describe("charter issuance", () => {
  it("issues a charter when standing and cost are met", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    const result = issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(result).toBe(true);

    const charterComponent = world.getComponent(PLAYER, "charter");
    expect(charterComponent).toBeDefined();
    expect(charterComponent?.permits.length).toBe(1);
    expect(charterComponent?.permits[0]?.charterId).toBe("oldroad_pass");
  });

  it("rejects issuance when standing is too low", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 5);

    const result = issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need standing 10 to obtain this charter.");
  });

  it("rejects issuance when cost cannot be paid", () => {
    const { world, ctx } = setup();
    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    const result = issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You cannot afford this charter.");
  });

  it("rejects issuance when player already holds permit", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    const first = issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(first).toBe(true);

    const second = issueCharter(ctx, PLAYER, "oldroad_pass", 1, 0);
    expect(second).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat?.at(-1)?.text).toBe("You already hold a permit for that charter.");
  });

  it("issues charter without cost when cost is absent", () => {
    const { world, ctx } = setup();
    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 5);

    const result = issueCharter(ctx, PLAYER, "ruin_access", 0, 0);
    expect(result).toBe(true);

    const charterComponent = world.getComponent(PLAYER, "charter");
    expect(charterComponent?.permits.length).toBe(1);
  });

  it("issues charter with zero duration that never expires", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    const result = issueCharter(ctx, PLAYER, "fishing_license", 0, 0);
    expect(result).toBe(true);

    const charterComponent = world.getComponent(PLAYER, "charter");
    expect(charterComponent?.permits[0]?.expiryTick).toBe(0);
  });
});

describe("charter validation", () => {
  it("validates permit for gated action", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);
    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);

    const result = validateCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(result).toBe(true);
  });

  it("fails validation when permit is missing", () => {
    const { ctx } = setup();
    const result = validateCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need a permit: Oldroad Pass.");
  });

  it("fails validation when permit has expired", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);
    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);

    const result = validateCharter(ctx, PLAYER, "oldroad_pass", 101, 0);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat?.at(-1)?.text).toBe("You need a permit: Oldroad Pass.");
  });

  it("hasPermit returns false when no charter component exists", () => {
    const { world } = setup();
    const result = hasPermit(world, PLAYER, "oldroad_pass", 0);
    expect(result).toBe(false);
  });
});

describe("charter expiry", () => {
  it("removes expired permits after duration", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);
    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);

    processCharterExpiry(ctx, 101, 0);

    const charterComponent = world.getComponent(PLAYER, "charter");
    expect(charterComponent?.permits.length).toBe(0);

    const state = ctx.deltas.peek();
    expect(state.chat?.at(-1)?.text).toBe("Your permit for Oldroad Pass has expired.");
  });

  it("does not remove permits before expiry", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);
    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);

    processCharterExpiry(ctx, 50, 0);

    const charterComponent = world.getComponent(PLAYER, "charter");
    expect(charterComponent?.permits.length).toBe(1);
  });

  it("does not remove zero-duration permits", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    issueCharter(ctx, PLAYER, "fishing_license", 0, 0);

    processCharterExpiry(ctx, 9999, 0);

    const charterComponent = world.getComponent(PLAYER, "charter");
    expect(charterComponent?.permits.length).toBe(1);
  });
});

describe("charter cost deduction", () => {
  it("deducts cost from inventory on issuance", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    const result = issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);
    expect(result).toBe(true);

    const state = ctx.deltas.peek();
    expect(state.inventoryDeltas).toBeDefined();
    expect(state.inventoryDeltas?.length).toBe(1);
    expect(state.inventoryDeltas?.[0]?.changes[0]?.itemId).toBe("coin");
  });

  it("records item audit on cost deduction", () => {
    const { world, ctx } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "coin", 100);

    setVar({ world, deltas: ctx.deltas }, PLAYER, "standing", 10);

    issueCharter(ctx, PLAYER, "oldroad_pass", 0, 0);

    const audit = ctx.itemAudit?.snapshot().filter((r) => r.metadata?.actorEntityId === PLAYER);
    expect(audit).toBeDefined();
    expect(audit?.length).toBe(1);
    expect(audit?.[0]?.reason).toBe("charter_cost");
    expect(audit?.[0]?.itemId).toBe("coin");
  });
});

import type { ItemDef } from "@old-town/shared/content-schemas/item";
import type { NpcDef } from "@old-town/shared/content-schemas/npc";
import type { ServiceFeeDef } from "@old-town/shared/content-schemas/service-fee";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  handleServiceFeeIntent,
  isServiceFeeAction,
  type ServiceFeeSystemContext,
} from "./service-fee-system";

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

const GUST_BEAD: ItemDef = {
  id: "gust_bead",
  name: "Gust Bead",
  stackable: true,
  tradeable: true,
  examine: "A bead of wind.",
  icon: "icon_gust_bead",
  value: 10,
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
  maxDurability: 100,
};

const LOAF: ItemDef = {
  id: "crusty_loaf",
  name: "Crusty Loaf",
  stackable: false,
  tradeable: true,
  examine: "Fresh from the oven.",
  icon: "icon_crusty_loaf",
  value: 5,
  options: [],
  tags: [],
};

const REPAIR_FEE: ServiceFeeDef = {
  id: "repair_gear",
  name: "Repair Gear",
  serviceType: "repair",
  baseFee: 10,
  levelMultiplier: 1.0,
  materialCost: [],
  currency: "coin",
  outputQuantity: 1,
};

const TELEPORT_FEE: ServiceFeeDef = {
  id: "teleport_home",
  name: "Teleport Home",
  serviceType: "teleport",
  baseFee: 50,
  levelMultiplier: 0.5,
  materialCost: [{ itemId: "gust_bead", quantity: 1 }],
  currency: "coin",
  outputQuantity: 1,
  destination: { x: 5, y: 5, plane: 0 },
};

const CRAFT_FEE: ServiceFeeDef = {
  id: "public_craft",
  name: "Public Crafting",
  serviceType: "craft",
  baseFee: 5,
  levelMultiplier: 0.2,
  materialCost: [],
  currency: "coin",
  outputItemId: "crusty_loaf",
  outputQuantity: 1,
};

const NPC_DEF: NpcDef = {
  id: "test_smith",
  name: "Test Smith",
  size: 1,
  respawnTicks: 10,
  wanderRadius: 0,
  options: [{ label: "Repair", actionId: "repair", priority: 5, requiredDistance: 1 }],
  movementType: "static",
  aggressionMode: "peaceful",
  contractEligible: false,
};

const ITEMS = new Map([COIN, GUST_BEAD, BLADE, LOAF].map((d) => [d.id, d]));

function setup(inventorySeed: readonly { itemId: string; quantity: number }[] = []) {
  const world = createWorld();
  const owner = world.createEntity();
  const npc = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 30, y: 30, plane: 0 });
  world.setComponent(owner, "actor", {
    entityId: owner,
    name: "Player",
    level: 10,
    appearanceId: "player",
  });
  world.setComponent(npc, "position", { entityId: npc, x: 30, y: 31, plane: 0 });
  world.setComponent(npc, "npc", {
    entityId: npc,
    npcId: "test_smith",
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
    npc: new Map([["test_smith", NPC_DEF]]),
    serviceFee: new Map([
      [REPAIR_FEE.id, REPAIR_FEE],
      [TELEPORT_FEE.id, TELEPORT_FEE],
      [CRAFT_FEE.id, CRAFT_FEE],
    ]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const map = createRuntimeMap();
  const collision = new CollisionMap(map);

  const ctx: ServiceFeeSystemContext = {
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

describe("isServiceFeeAction", () => {
  it("returns true for known service actions", () => {
    expect(isServiceFeeAction("repair")).toBe(true);
    expect(isServiceFeeAction("teleport")).toBe(true);
    expect(isServiceFeeAction("cleanse")).toBe(true);
  });

  it("returns false for unknown actions", () => {
    expect(isServiceFeeAction("attack")).toBe(false);
    expect(isServiceFeeAction("talk")).toBe(false);
    expect(isServiceFeeAction("trade")).toBe(false);
  });
});

describe("handleServiceFeeIntent — repair", () => {
  it("deducts coins and repairs items with durability", () => {
    const { ctx, owner, npc, inventory } = setup([
      { itemId: "coin", quantity: 100 },
      { itemId: "test_blade", quantity: 1 },
    ]);
    // Degrade the blade
    const blade = inventory.slots[1];
    expect(blade).toBeDefined();
    inventory.slots[1] = { ...blade as NonNullable<typeof blade>, durability: 50 };

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "repair" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(80); // 100 - (10 + 1.0*10)
    expect(inventory.slots[1]?.durability).toBe(100);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("Repaired 1 item.");
  });

  it("emits 'nothing to repair' when no items have durability", () => {
    const { ctx, owner, npc } = setup([{ itemId: "coin", quantity: 100 }]);

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "repair" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("Nothing needed repair.");
  });

  it("rejects repair when player has insufficient coins", () => {
    const { ctx, owner, npc } = setup([{ itemId: "coin", quantity: 5 }]);

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "repair" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You don't have enough coin for that service.");
  });
});

describe("handleServiceFeeIntent — teleport", () => {
  it("deducts coins and beads and teleports the player", () => {
    const { ctx, owner, npc, inventory } = setup([
      { itemId: "coin", quantity: 100 },
      { itemId: "gust_bead", quantity: 2 },
    ]);

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "teleport" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(45); // 100 - (50 + 0.5*10)
    expect(count(inventory, "gust_bead")).toBe(1);

    const pos = ctx.world.getComponent(owner, "position");
    expect(pos).toMatchObject({ x: 5, y: 5, plane: 0 });
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You are teleported away.");
  });

  it("rejects teleport when missing required beads", () => {
    const { ctx, owner, npc } = setup([{ itemId: "coin", quantity: 100 }]);

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "teleport" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe(
      "You don't have the required materials for that service.",
    );
  });
});

describe("handleServiceFeeIntent — distance validation", () => {
  it("rejects service when too far from NPC", () => {
    const { ctx, owner, npc } = setup([{ itemId: "coin", quantity: 100 }]);
    ctx.world.setComponent(owner, "position", { entityId: owner, x: 0, y: 0, plane: 0 });

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "repair" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("You are too far away.");
  });
});

describe("handleServiceFeeIntent — unknown service", () => {
  it("falls through when service fee definition is not found", () => {
    const { ctx, owner, npc } = setup([{ itemId: "coin", quantity: 100 }]);
    const registries = makeRegistries({
      item: ITEMS,
      npc: new Map([["test_smith", NPC_DEF]]),
      serviceFee: new Map(),
    });
    const ctxWithoutFee = { ...ctx, registries };

    const result = handleServiceFeeIntent(
      ctxWithoutFee,
      owner,
      { npcEntityId: npc, actionId: "repair" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(ctxWithoutFee.deltas.peek().chat?.[0]?.text).toBe("That service is not available.");
  });
});

describe("handleServiceFeeIntent — craft", () => {
  it("deducts coins and adds crafted item to inventory", () => {
    const { ctx, owner, npc, inventory } = setup([{ itemId: "coin", quantity: 100 }]);

    const result = handleServiceFeeIntent(
      ctx,
      owner,
      { npcEntityId: npc, actionId: "craft" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toBe(true);
    expect(count(inventory, "coin")).toBe(93); // 100 - (5 + 0.2*10)
    expect(count(inventory, "crusty_loaf")).toBe(1);
    expect(ctx.deltas.peek().chat?.[0]?.text).toBe("Crafted 1 crusty_loaf.");
  });
});

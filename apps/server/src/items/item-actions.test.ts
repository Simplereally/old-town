import type { ItemDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { ConsumableSystem } from "../systems/consumable-system";
import { createEquipment } from "./equipment";
import { addItem, catalogFromItems, count, createInventory } from "./inventory";
import { handleItemIntent, handleUnequipIntent, type ItemActionContext } from "./item-actions";
import { ItemAuditLog } from "./item-audit";

function defItem(over: Partial<ItemDef> & { id: string }): ItemDef {
  return {
    id: over.id,
    name: over.name ?? over.id,
    stackable: over.stackable ?? false,
    tradeable: over.tradeable ?? true,
    examine: over.examine ?? "An item.",
    icon: over.icon ?? `icon_${over.id}`,
    value: over.value ?? 1,
    options: over.options ?? [],
    tags: over.tags ?? [],
    ...(over.equipment ? { equipment: over.equipment } : {}),
    ...(over.consumable ? { consumable: over.consumable } : {}),
  };
}

const BLADE = defItem({
  id: "test_blade",
  name: "Test Blade",
  examine: "A sharp blade.",
  options: ["wield", "drop"],
  equipment: { slot: "weapon", bonuses: {}, requirements: [] },
});
const HELM = defItem({
  id: "test_helm",
  name: "Test Helm",
  options: ["wear", "drop"],
  equipment: { slot: "head", bonuses: {}, requirements: [] },
});
const BREAD = defItem({
  id: "test_bread",
  name: "Test Bread",
  stackable: true,
  examine: "Fresh bread.",
  options: ["eat", "drop"],
  consumable: { heal: 5, consumeTicks: 3 },
});
const AXE = defItem({ id: "test_axe", name: "Test Axe", options: ["drop"], tags: ["axe"] });

const ITEMS = new Map([BLADE, HELM, BREAD, AXE].map((d) => [d.id, d]));

function setup(
  seed: readonly { itemId: string; quantity: number }[],
  combat?: { health: number; maxHealth: number },
) {
  const world = createWorld();
  const owner = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "equipment", createEquipment(owner));
  if (combat) {
    world.setComponent(owner, "combatant", {
      entityId: owner,
      health: combat.health,
      maxHealth: combat.maxHealth,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
    });
  }
  const catalog = catalogFromItems(ITEMS);
  for (const { itemId, quantity } of seed) {
    addItem(inventory, catalog, itemId, quantity);
  }
  const deltas = new DeltaAccumulator();
  const consumables = new ConsumableSystem();
  const itemAudit = new ItemAuditLog();
  const ctx: ItemActionContext = { world, deltas, items: ITEMS, consumables, itemAudit };
  return { world, owner, inventory, deltas, consumables, itemAudit, ctx };
}

const TICK = 100;
const SERVER_TIME = 1_000;

function uidOf(inventory: ReturnType<typeof setup>["inventory"], slot = 0): number {
  return inventory.slots[slot]?.uid ?? 0;
}

describe("handleItemIntent — validation", () => {
  it("rejects a uid that is not in the inventory without mutating", () => {
    const { ctx, owner, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: 999, actionId: "drop" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("invalid");
    expect(deltas.peek().inventoryDelta).toBeUndefined();
    expect(deltas.peek().chat?.[0]).toMatchObject({ channel: "system", entityId: owner });
  });

  it("addresses every action message privately to the actor", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "examine" },
      TICK,
      SERVER_TIME,
    );
    const chat = deltas.peek().chat?.[0];
    expect(chat).toMatchObject({ channel: "system", entityId: owner, serverTime: SERVER_TIME });
  });
});

describe("handleItemIntent — examine", () => {
  it("returns the examine text and mutates nothing", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "examine" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toEqual({ outcome: "examined", message: "A sharp blade." });
    expect(count(inventory, "test_blade")).toBe(1);
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleItemIntent — drop", () => {
  it("removes the whole slot and emits an inventory delta", () => {
    const { ctx, owner, inventory, deltas, itemAudit } = setup([
      { itemId: "test_axe", quantity: 1 },
    ]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "drop" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("dropped");
    expect(count(inventory, "test_axe")).toBe(0);
    expect(deltas.peek().inventoryDelta?.changes).toEqual([{ slot: 0, itemId: null, quantity: 0 }]);
    expect(itemAudit.snapshot()[0]).toMatchObject({
      tick: TICK,
      characterId: `entity:${owner}`,
      itemId: "test_axe",
      quantity: 1,
      reason: "inventory_drop",
      beforeQuantity: 1,
      afterQuantity: 0,
    });
  });
});

describe("handleItemIntent — equip", () => {
  it("moves an equippable item into its slot and out of the inventory", () => {
    const { ctx, owner, world, inventory, itemAudit } = setup([
      { itemId: "test_blade", quantity: 1 },
    ]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "wield" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("equipped");
    expect(count(inventory, "test_blade")).toBe(0);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("test_blade");
    expect(itemAudit.snapshot()[0]).toMatchObject({
      reason: "equipment_equip",
      itemId: "test_blade",
      beforeQuantity: 1,
      afterQuantity: 0,
      metadata: expect.objectContaining({ equipmentSlot: "weapon" }),
    });
  });

  it("swaps the previously-equipped item back into the inventory", () => {
    const { ctx, owner, world, inventory, itemAudit } = setup([
      { itemId: "test_blade", quantity: 1 },
    ]);
    const equipment = world.getComponent(owner, "equipment");
    if (equipment) {
      equipment.slots.weapon = "test_axe"; // pretend an axe is already wielded
    }
    handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "wield" },
      TICK,
      SERVER_TIME,
    );

    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("test_blade");
    expect(count(inventory, "test_axe")).toBe(1);
    expect(count(inventory, "test_blade")).toBe(0);
    expect(itemAudit.snapshot().map((record) => record.reason)).toEqual([
      "equipment_equip",
      "equipment_swap_out",
    ]);
  });

  it("equips into the correct content-defined slot", () => {
    const { ctx, owner, world, inventory } = setup([{ itemId: "test_helm", quantity: 1 }]);
    handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "wear" },
      TICK,
      SERVER_TIME,
    );
    expect(world.getComponent(owner, "equipment")?.slots.head).toBe("test_helm");
  });

  it("emits an EQUIPMENT entity update so the client can render the change", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_blade", quantity: 1 }]);
    handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "wield" },
      TICK,
      SERVER_TIME,
    );

    const update = deltas.peek().entityUpdates.find((u) => u.entityId === owner);
    expect(update?.changes.equipment?.slots[3]).toBe("test_blade"); // weapon index
  });

  it("refuses to equip a non-equippable item without mutating", () => {
    const { ctx, owner, world, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "equip" },
      TICK,
      SERVER_TIME,
    );

    expect(result).toEqual({ outcome: "invalid", message: "You can't equip that." });
    expect(count(inventory, "test_axe")).toBe(1);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBeUndefined();
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleItemIntent — eat", () => {
  it("consumes one unit, queues the heal, and applies the eat delay", () => {
    const { ctx, owner, world, inventory, deltas, consumables, itemAudit } = setup(
      [{ itemId: "test_bread", quantity: 3 }],
      { health: 4, maxHealth: 10 },
    );
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "eat" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("eaten");
    expect(count(inventory, "test_bread")).toBe(2);
    expect(deltas.peek().inventoryDelta?.changes[0]).toMatchObject({
      slot: 0,
      itemId: "test_bread",
      quantity: 2,
    });
    // The heal is deferred to the stat-change phase — health is untouched at input close.
    expect(consumables.pendingCount).toBe(1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(4);
    expect(world.getComponent(owner, "combatant")?.eatBlockedUntilTick).toBe(TICK + 3);
    expect(itemAudit.snapshot()[0]).toMatchObject({
      reason: "consume",
      itemId: "test_bread",
      quantity: 1,
      beforeQuantity: 3,
      afterQuantity: 2,
      metadata: expect.objectContaining({ heal: 5, consumeTicks: 3 }),
    });
  });

  it("silently ignores a second eat while still inside the eat delay", () => {
    const { ctx, owner, inventory, consumables } = setup([{ itemId: "test_bread", quantity: 3 }], {
      health: 4,
      maxHealth: 10,
    });
    handleItemIntent(ctx, owner, { itemUid: uidOf(inventory), actionId: "eat" }, TICK, SERVER_TIME);
    const second = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "eat" },
      TICK + 1, // still < TICK + 3
      SERVER_TIME,
    );

    expect(second).toEqual({ outcome: "invalid", message: "" });
    expect(count(inventory, "test_bread")).toBe(2); // only the first eat consumed a unit
    expect(consumables.pendingCount).toBe(1);
  });

  it("eats again once the eat delay has elapsed", () => {
    const { ctx, owner, inventory, consumables } = setup([{ itemId: "test_bread", quantity: 3 }], {
      health: 4,
      maxHealth: 10,
    });
    handleItemIntent(ctx, owner, { itemUid: uidOf(inventory), actionId: "eat" }, TICK, SERVER_TIME);
    const later = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "eat" },
      TICK + 3,
      SERVER_TIME,
    );

    expect(later.outcome).toBe("eaten");
    expect(count(inventory, "test_bread")).toBe(1);
    expect(consumables.pendingCount).toBe(2);
  });

  it("fails to eat without a combatant (nothing to heal) and keeps the food", () => {
    const { ctx, owner, inventory, deltas, consumables } = setup([
      { itemId: "test_bread", quantity: 1 },
    ]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "eat" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("invalid");
    expect(count(inventory, "test_bread")).toBe(1);
    expect(consumables.pendingCount).toBe(0);
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });

  it("fails to eat a non-consumable item without mutating", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }], {
      health: 4,
      maxHealth: 10,
    });
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "eat" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("invalid");
    expect(count(inventory, "test_axe")).toBe(1);
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleItemIntent — use / unknown", () => {
  it("acknowledges use without mutating until a target is selected", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "use" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("used");
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });

  it("treats an unknown option as a no-op", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const result = handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "smell" },
      TICK,
      SERVER_TIME,
    );

    expect(result.outcome).toBe("invalid");
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleUnequipIntent", () => {
  it("returns an equipped item to the inventory and emits an equipment update", () => {
    const { ctx, owner, world, inventory, deltas, itemAudit } = setup([
      { itemId: "test_blade", quantity: 1 },
    ]);
    handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "wield" },
      TICK,
      SERVER_TIME,
    );

    const result = handleUnequipIntent(ctx, owner, 3, TICK + 1, SERVER_TIME); // weapon index
    expect(result.outcome).toBe("unequipped");
    expect(count(inventory, "test_blade")).toBe(1);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBeUndefined();
    const update = deltas.peek().entityUpdates.find((u) => u.entityId === owner);
    expect(update?.changes.equipment?.slots[3]).toBeNull();
    expect(itemAudit.snapshot().map((record) => record.reason)).toEqual([
      "equipment_equip",
      "equipment_unequip",
    ]);
  });

  it("fails to unequip into a full inventory without mutating", () => {
    const { ctx, owner, world, inventory } = setup([{ itemId: "test_blade", quantity: 1 }]);
    handleItemIntent(
      ctx,
      owner,
      { itemUid: uidOf(inventory), actionId: "wield" },
      TICK,
      SERVER_TIME,
    );
    // Fill every inventory slot so the unequip has nowhere to land.
    for (let i = 0; i < inventory.capacity; i += 1) {
      if (!inventory.slots[i]) {
        inventory.slots[i] = { itemId: "test_axe", quantity: 1, uid: 1000 + i };
      }
    }
    const result = handleUnequipIntent(ctx, owner, 3, TICK + 1, SERVER_TIME);
    expect(result.outcome).toBe("invalid");
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("test_blade");
  });
});

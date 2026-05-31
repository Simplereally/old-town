import type { ItemDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { addItem, catalogFromItems, count, createInventory } from "./inventory";
import { type ItemActionContext, handleItemIntent } from "./item-actions";

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
  consumable: { heal: 5, consumeTicks: 1 },
});
const AXE = defItem({ id: "test_axe", name: "Test Axe", options: ["drop"], tags: ["axe"] });

const ITEMS = new Map([BLADE, HELM, BREAD, AXE].map((d) => [d.id, d]));

function setup(seed: readonly { itemId: string; quantity: number }[]) {
  const world = createWorld();
  const owner = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.stores.inventory.set(owner, inventory);
  world.stores.equipment.set(owner, { entityId: owner, slots: {} });
  const catalog = catalogFromItems(ITEMS);
  for (const { itemId, quantity } of seed) {
    addItem(inventory, catalog, itemId, quantity);
  }
  const deltas = new DeltaAccumulator();
  const ctx: ItemActionContext = { world, deltas, items: ITEMS };
  return { world, owner, inventory, deltas, ctx };
}

const SERVER_TIME = 1_000;

describe("handleItemIntent — validation", () => {
  it("rejects a uid that is not in the inventory without mutating", () => {
    const { ctx, owner, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const result = handleItemIntent(ctx, owner, { itemUid: 999, option: "drop" }, SERVER_TIME);

    expect(result.outcome).toBe("invalid");
    expect(deltas.peek().inventoryDelta).toBeUndefined();
    expect(deltas.peek().chat?.[0]).toMatchObject({ channel: "system", entityId: owner });
  });

  it("addresses every action message privately to the actor", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    handleItemIntent(ctx, owner, { itemUid: uid, option: "examine" }, SERVER_TIME);
    const chat = deltas.peek().chat?.[0];
    expect(chat).toMatchObject({ channel: "system", entityId: owner, serverTime: SERVER_TIME });
  });
});

describe("handleItemIntent — examine", () => {
  it("returns the examine text and mutates nothing", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "examine" }, SERVER_TIME);

    expect(result).toEqual({ outcome: "examined", message: "A sharp blade." });
    expect(count(inventory, "test_blade")).toBe(1);
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleItemIntent — drop", () => {
  it("removes the whole slot and emits an inventory delta", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "drop" }, SERVER_TIME);

    expect(result.outcome).toBe("dropped");
    expect(count(inventory, "test_axe")).toBe(0);
    expect(deltas.peek().inventoryDelta?.changes).toEqual([{ slot: 0, itemId: null, quantity: 0 }]);
  });
});

describe("handleItemIntent — equip", () => {
  it("moves an equippable item into its slot and out of the inventory", () => {
    const { ctx, owner, world, inventory } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "wield" }, SERVER_TIME);

    expect(result.outcome).toBe("equipped");
    expect(count(inventory, "test_blade")).toBe(0);
    expect(world.stores.equipment.get(owner)?.slots.weapon).toBe("test_blade");
  });

  it("swaps the previously-equipped item back into the inventory", () => {
    const { ctx, owner, world, inventory } = setup([{ itemId: "test_blade", quantity: 1 }]);
    const equipment = world.stores.equipment.get(owner);
    if (equipment) {
      equipment.slots.weapon = "test_axe"; // pretend an axe is already wielded
    }
    const uid = inventory.slots[0]?.uid ?? 0;
    handleItemIntent(ctx, owner, { itemUid: uid, option: "wield" }, SERVER_TIME);

    expect(world.stores.equipment.get(owner)?.slots.weapon).toBe("test_blade");
    expect(count(inventory, "test_axe")).toBe(1);
    expect(count(inventory, "test_blade")).toBe(0);
  });

  it("equips into the correct content-defined slot", () => {
    const { ctx, owner, world, inventory } = setup([{ itemId: "test_helm", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    handleItemIntent(ctx, owner, { itemUid: uid, option: "wear" }, SERVER_TIME);
    expect(world.stores.equipment.get(owner)?.slots.head).toBe("test_helm");
  });

  it("refuses to equip a non-equippable item without mutating", () => {
    const { ctx, owner, world, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "equip" }, SERVER_TIME);

    expect(result).toEqual({ outcome: "invalid", message: "You can't equip that." });
    expect(count(inventory, "test_axe")).toBe(1);
    expect(world.stores.equipment.get(owner)?.slots.weapon).toBeUndefined();
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleItemIntent — eat", () => {
  it("consumes one unit of a stackable food on success", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_bread", quantity: 3 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "eat" }, SERVER_TIME);

    expect(result.outcome).toBe("eaten");
    expect(count(inventory, "test_bread")).toBe(2);
    expect(deltas.peek().inventoryDelta?.changes[0]).toMatchObject({
      slot: 0,
      itemId: "test_bread",
      quantity: 2,
    });
  });

  it("fails to eat a non-consumable item without mutating", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "eat" }, SERVER_TIME);

    expect(result.outcome).toBe("invalid");
    expect(count(inventory, "test_axe")).toBe(1);
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

describe("handleItemIntent — use / unknown", () => {
  it("acknowledges use as a placeholder without mutating", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "use" }, SERVER_TIME);

    expect(result.outcome).toBe("used");
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });

  it("treats an unknown option as a no-op", () => {
    const { ctx, owner, inventory, deltas } = setup([{ itemId: "test_axe", quantity: 1 }]);
    const uid = inventory.slots[0]?.uid ?? 0;
    const result = handleItemIntent(ctx, owner, { itemUid: uid, option: "smell" }, SERVER_TIME);

    expect(result.outcome).toBe("invalid");
    expect(deltas.peek().inventoryDelta).toBeUndefined();
  });
});

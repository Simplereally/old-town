import type { EntityId, ItemDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import type { SkillState } from "../ecs/components";
import { createWorld } from "../ecs/world";
import {
  aggregateBonuses,
  createEquipment,
  equipItem,
  equipmentUpdate,
  meetsRequirements,
  unequipSlot,
  zeroBonuses,
} from "./equipment";
import { addItem, catalogFromItems, count, createInventory } from "./inventory";

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
  };
}

const IRON_BLADE = defItem({
  id: "iron_blade",
  name: "Iron Blade",
  options: ["wield"],
  equipment: { slot: "weapon", bonuses: { slashAttack: 5, meleeStrength: 3 }, requirements: [] },
});
const STEEL_BLADE = defItem({
  id: "steel_blade",
  name: "Steel Blade",
  options: ["wield"],
  equipment: {
    slot: "weapon",
    bonuses: { slashAttack: 9 },
    requirements: [{ skillId: "attack", level: 5 }],
  },
});
const BRONZE_HELM = defItem({
  id: "bronze_helm",
  name: "Bronze Helm",
  options: ["wear"],
  equipment: { slot: "head", bonuses: { stabDefence: 2 }, requirements: [] },
});
const ROCK = defItem({ id: "rock", name: "Rock", options: ["drop"] });

const ITEMS = new Map([IRON_BLADE, STEEL_BLADE, BRONZE_HELM, ROCK].map((d) => [d.id, d]));

function setup(seed: readonly { itemId: string; quantity: number }[], capacity = 28) {
  const world = createWorld();
  const owner = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, capacity);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "equipment", createEquipment(owner));
  const catalog = catalogFromItems(ITEMS);
  for (const { itemId, quantity } of seed) {
    addItem(inventory, catalog, itemId, quantity);
  }
  const ctx = { world, items: ITEMS };
  return { world, owner, inventory, ctx };
}

function setSkill(
  world: ReturnType<typeof createWorld>,
  owner: EntityId,
  skillId: string,
  level: number,
) {
  const skills: Record<string, SkillState> = { [skillId]: { level, xp: 0, boost: 0, drain: 0 } };
  world.setComponent(owner, "skills", { entityId: owner, skills });
}

describe("zeroBonuses", () => {
  it("has every combat-bonus field present at zero", () => {
    const z = zeroBonuses();
    expect(z.slashAttack).toBe(0);
    expect(z.prayer).toBe(0);
    expect(z.magicDamage).toBe(0);
  });
});

describe("equipItem", () => {
  it("moves the item into its slot, out of the inventory, and aggregates bonuses", () => {
    const { ctx, owner, inventory, world } = setup([{ itemId: "iron_blade", quantity: 1 }]);
    const result = equipItem(ctx, owner, inventory, 0, IRON_BLADE);

    expect(result.ok).toBe(true);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("iron_blade");
    expect(count(inventory, "iron_blade")).toBe(0);
    const bonuses = world.getComponent(owner, "equipment")?.bonuses;
    expect(bonuses?.slashAttack).toBe(5);
    expect(bonuses?.meleeStrength).toBe(3);
  });

  it("rejects an item whose skill requirement is unmet, without mutating", () => {
    const { ctx, owner, inventory, world } = setup([{ itemId: "steel_blade", quantity: 1 }]);
    setSkill(world, owner, "attack", 1);
    const result = equipItem(ctx, owner, inventory, 0, STEEL_BLADE);

    expect(result).toEqual({ ok: false, reason: "requirements" });
    expect(count(inventory, "steel_blade")).toBe(1);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBeUndefined();
  });

  it("equips once the skill requirement is met", () => {
    const { ctx, owner, inventory, world } = setup([{ itemId: "steel_blade", quantity: 1 }]);
    setSkill(world, owner, "attack", 5);
    const result = equipItem(ctx, owner, inventory, 0, STEEL_BLADE);
    expect(result.ok).toBe(true);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("steel_blade");
  });

  it("swaps the previously-equipped item back into the inventory and re-aggregates", () => {
    const { ctx, owner, inventory, world } = setup([
      { itemId: "iron_blade", quantity: 1 },
      { itemId: "steel_blade", quantity: 1 },
    ]);
    setSkill(world, owner, "attack", 5);
    equipItem(ctx, owner, inventory, 0, IRON_BLADE);
    // steel_blade is now at slot 0 (iron freed slot 0, then occupies... find it)
    const steelSlot = inventory.slots.findIndex((s) => s?.itemId === "steel_blade");
    equipItem(ctx, owner, inventory, steelSlot, STEEL_BLADE);

    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("steel_blade");
    expect(count(inventory, "iron_blade")).toBe(1);
    expect(world.getComponent(owner, "equipment")?.bonuses.slashAttack).toBe(9);
  });
});

describe("aggregateBonuses", () => {
  it("sums bonuses across multiple equipped slots", () => {
    const { ctx, owner, inventory, world } = setup([
      { itemId: "iron_blade", quantity: 1 },
      { itemId: "bronze_helm", quantity: 1 },
    ]);
    equipItem(ctx, owner, inventory, 0, IRON_BLADE);
    equipItem(
      ctx,
      owner,
      inventory,
      inventory.slots.findIndex((s) => s?.itemId === "bronze_helm"),
      BRONZE_HELM,
    );

    const equipment = world.getComponent(owner, "equipment");
    if (!equipment) throw new Error("equipment missing");
    const totals = aggregateBonuses(equipment, ITEMS);
    expect(totals.slashAttack).toBe(5);
    expect(totals.meleeStrength).toBe(3);
    expect(totals.stabDefence).toBe(2);
  });
});

describe("equipmentUpdate", () => {
  it("produces an 11-slot indexed array in canonical order", () => {
    const { ctx, owner, inventory, world } = setup([
      { itemId: "iron_blade", quantity: 1 },
      { itemId: "bronze_helm", quantity: 1 },
    ]);
    equipItem(ctx, owner, inventory, 0, IRON_BLADE);
    equipItem(
      ctx,
      owner,
      inventory,
      inventory.slots.findIndex((s) => s?.itemId === "bronze_helm"),
      BRONZE_HELM,
    );

    const equipment = world.getComponent(owner, "equipment");
    if (!equipment) throw new Error("equipment missing");
    const update = equipmentUpdate(equipment);
    expect(update.slots).toHaveLength(11);
    expect(update.slots[0]).toBe("bronze_helm"); // head
    expect(update.slots[3]).toBe("iron_blade"); // weapon
    expect(update.slots[5]).toBeNull(); // shield (empty)
  });
});

describe("meetsRequirements", () => {
  it("passes when no requirements and respects level gates", () => {
    const { world, owner } = setup([]);
    expect(meetsRequirements(IRON_BLADE, undefined)).toBe(true);
    setSkill(world, owner, "attack", 4);
    expect(meetsRequirements(STEEL_BLADE, world.getComponent(owner, "skills"))).toBe(false);
    setSkill(world, owner, "attack", 5);
    expect(meetsRequirements(STEEL_BLADE, world.getComponent(owner, "skills"))).toBe(true);
  });
});

describe("unequipSlot", () => {
  it("returns the item to the inventory and zeroes the recomputed bonuses", () => {
    const { ctx, owner, inventory, world } = setup([{ itemId: "iron_blade", quantity: 1 }]);
    equipItem(ctx, owner, inventory, 0, IRON_BLADE);
    const result = unequipSlot(ctx, owner, inventory, "weapon");

    expect(result.ok).toBe(true);
    expect(count(inventory, "iron_blade")).toBe(1);
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBeUndefined();
    expect(world.getComponent(owner, "equipment")?.bonuses.slashAttack).toBe(0);
  });

  it("fails on an empty slot without mutating", () => {
    const { ctx, owner, inventory } = setup([]);
    expect(unequipSlot(ctx, owner, inventory, "weapon")).toEqual({ ok: false, reason: "empty" });
  });

  it("fails when the inventory is full, leaving the item equipped", () => {
    const { ctx, owner, inventory, world } = setup([{ itemId: "iron_blade", quantity: 1 }], 1);
    equipItem(ctx, owner, inventory, 0, IRON_BLADE); // frees the only slot
    addItem(inventory, catalogFromItems(ITEMS), "rock", 1); // refill the slot

    const result = unequipSlot(ctx, owner, inventory, "weapon");
    expect(result).toEqual({ ok: false, reason: "inventory_full" });
    expect(world.getComponent(owner, "equipment")?.slots.weapon).toBe("iron_blade");
    expect(count(inventory, "rock")).toBe(1);
  });
});

/**
 * Authoritative equipment system (POC_SPEC §16.3, §16.4, §13.1).
 *
 * Owns the *combat-stat and appearance* consequences of equipping items — the layer above the
 * item logistics in {@link import("./item-actions")}. Equip/unequip validate content-defined
 * skill requirements, swap the occupied slot, recompute the aggregated combat bonuses (only on
 * change, never per tick), and produce the wire-level {@link EquipmentUpdate} for the client.
 */
import {
  type CombatBonuses,
  EQUIPMENT_SLOTS,
  type EntityId,
  type EquipmentSlotName,
  type EquipmentUpdate,
  type InventorySlotChange,
  type ItemDef,
} from "@old-town/shared";
import type { EquipmentComponent, InventoryComponent, SkillsComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import { addItem, buildDelta, catalogFromItems, freeSlotCount, removeFromSlot } from "./inventory";
import type { ItemCatalog } from "./inventory";

/** Every combat-bonus field, used to seed a zeroed aggregate. */
const BONUS_FIELDS = [
  "stabAttack",
  "slashAttack",
  "crushAttack",
  "magicAttack",
  "rangedAttack",
  "stabDefence",
  "slashDefence",
  "crushDefence",
  "magicDefence",
  "rangedDefence",
  "meleeStrength",
  "rangedStrength",
  "magicDamage",
  "prayer",
] as const satisfies readonly (keyof CombatBonuses)[];

/** All combat-bonus fields present as concrete numbers (so the aggregate is arithmetic-safe). */
type BonusTotals = Record<(typeof BONUS_FIELDS)[number], number>;

/** A zeroed combat-bonus aggregate (all fields present at 0). */
export function zeroBonuses(): BonusTotals {
  const bonuses = {} as BonusTotals;
  for (const field of BONUS_FIELDS) {
    bonuses[field] = 0;
  }
  return bonuses;
}

/** Create an empty equipment container with zeroed bonuses. */
export function createEquipment(entityId: EntityId): EquipmentComponent {
  return { entityId, slots: {}, bonuses: zeroBonuses() };
}

/** Sum the bonuses of every equipped item over the zeroed base (POC_SPEC §16.4). */
export function aggregateBonuses(
  equipment: EquipmentComponent,
  items: ReadonlyMap<string, ItemDef>,
): BonusTotals {
  const total = zeroBonuses();
  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = equipment.slots[slot];
    if (!itemId) {
      continue;
    }
    const bonuses = items.get(itemId)?.equipment?.bonuses;
    if (!bonuses) {
      continue;
    }
    for (const field of BONUS_FIELDS) {
      total[field] += bonuses[field] ?? 0;
    }
  }
  return total;
}

/** Build the wire-level visible-equipment payload (indexed by canonical slot order). */
export function equipmentUpdate(equipment: EquipmentComponent): EquipmentUpdate {
  const slots = EQUIPMENT_SLOTS.map((slot) => equipment.slots[slot] ?? null);
  return { slots };
}

/** Whether the actor meets every skill requirement an item declares for equipping. */
export function meetsRequirements(def: ItemDef, skills: SkillsComponent | undefined): boolean {
  const requirements = def.equipment?.requirements ?? [];
  for (const requirement of requirements) {
    const level = skills?.skills[requirement.skillId]?.level ?? 1;
    if (level < requirement.level) {
      return false;
    }
  }
  return true;
}

export type EquipResult =
  | {
      readonly ok: true;
      readonly equipment: EquipmentComponent;
      readonly changes: InventorySlotChange[];
    }
  | { readonly ok: false; readonly reason: "requirements" };

export interface EquipContext {
  readonly world: World;
  readonly items: ReadonlyMap<string, ItemDef>;
}

function getOrCreateEquipment(world: World, owner: EntityId): EquipmentComponent {
  const existing = world.stores.equipment.get(owner);
  if (existing) {
    return existing;
  }
  const created = createEquipment(owner);
  world.stores.equipment.set(owner, created);
  return created;
}

/**
 * Equip the item in inventory `slot` into its content-defined equipment slot. Validates skill
 * requirements, swaps any occupied slot back into the inventory (non-lossy — the equipping item
 * frees its slot first), and recomputes the aggregated bonuses. The returned slot changes are
 * the inventory mutations; the equipment payload is produced separately by the caller.
 */
export function equipItem(
  ctx: EquipContext,
  owner: EntityId,
  inventory: InventoryComponent,
  slot: number,
  def: ItemDef,
): EquipResult {
  const targetSlot = def.equipment?.slot;
  const occupant = inventory.slots[slot];
  if (!targetSlot || !occupant) {
    return { ok: false, reason: "requirements" };
  }

  const skills = ctx.world.stores.skills.get(owner);
  if (!meetsRequirements(def, skills)) {
    return { ok: false, reason: "requirements" };
  }

  const equipment = getOrCreateEquipment(ctx.world, owner);
  const previousItemId = equipment.slots[targetSlot];
  const equippingItemId = occupant.itemId;

  // Free the equipping item's slot first so the swapped-out item always has room.
  const { changes } = removeFromSlot(inventory, slot, occupant.quantity);
  equipment.slots[targetSlot] = equippingItemId;
  if (previousItemId) {
    const catalog: ItemCatalog = catalogFromItems(ctx.items);
    const { changes: addBack } = addItem(inventory, catalog, previousItemId, 1);
    changes.push(...addBack);
  }

  equipment.bonuses = aggregateBonuses(equipment, ctx.items);
  return { ok: true, equipment, changes };
}

export type UnequipResult =
  | {
      readonly ok: true;
      readonly equipment: EquipmentComponent;
      readonly itemId: string;
      readonly changes: InventorySlotChange[];
    }
  | { readonly ok: false; readonly reason: "empty" | "inventory_full" };

/**
 * Unequip the item in `slotName` back into the inventory. Fails (without mutating) when the slot
 * is empty or the inventory has no free space. Recomputes the aggregated bonuses on success.
 */
export function unequipSlot(
  ctx: EquipContext,
  owner: EntityId,
  inventory: InventoryComponent,
  slotName: EquipmentSlotName,
): UnequipResult {
  const equipment = ctx.world.stores.equipment.get(owner);
  const itemId = equipment?.slots[slotName];
  if (!equipment || !itemId) {
    return { ok: false, reason: "empty" };
  }
  if (freeSlotCount(inventory) < 1) {
    return { ok: false, reason: "inventory_full" };
  }

  const catalog: ItemCatalog = catalogFromItems(ctx.items);
  const { added, changes } = addItem(inventory, catalog, itemId, 1);
  if (added < 1) {
    return { ok: false, reason: "inventory_full" };
  }
  delete equipment.slots[slotName];
  equipment.bonuses = aggregateBonuses(equipment, ctx.items);
  return { ok: true, equipment, itemId, changes };
}

/** Re-export for callers that emit inventory deltas alongside equipment changes. */
export { buildDelta };

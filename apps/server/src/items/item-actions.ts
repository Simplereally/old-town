/**
 * Authoritative item-action dispatch (POC_SPEC §16, §13.9).
 *
 * Routes a client {@link ItemIntent} (an inventory item `uid` + an actionId) to a small
 * server-side "script" per option. The client never mutates inventory — it only asks; the
 * server validates the item still exists in the slot, that the action's content preconditions
 * are met (e.g. equippable / edible), and then mutates *only* through the inventory container
 * functions, emitting the resulting deltas and a private system message to the actor.
 *
 * Separation of concerns across E08:
 *   - This module (S02) owns item *logistics*: dispatch, validation, and moving/consuming
 *     items between inventory and equipment.
 *   - S03 layers combat-bonus/appearance derivation onto equip changes.
 *   - S04 layers HP healing + eat-delay/tick-phase priority onto the eat script.
 */
import { type EntityId, EQUIPMENT_SLOTS, type ItemDef, type ItemIntent } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { ConsumableSystem } from "../systems/consumable-system";
import { equipItem, equipmentUpdate, unequipSlot } from "./equipment";
import { buildDelta, count, findSlotByUid, removeFromSlot } from "./inventory";
import type { ItemAuditLog } from "./item-audit";

export interface ItemActionContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  /** Item registry for definition lookups (examine text, equip slot, consumable, stackable). */
  readonly items: ReadonlyMap<string, ItemDef>;
  /** Defers eat/drink heals to the stat-change tick phase (POC_SPEC §13.9, §9.1). */
  readonly consumables: ConsumableSystem;
  readonly itemAudit?: ItemAuditLog | undefined;
}

/** What the dispatcher did, for callers/tests. `invalid` means no state changed. */
export type ItemActionOutcome =
  | "examined"
  | "dropped"
  | "equipped"
  | "unequipped"
  | "eaten"
  | "used"
  | "invalid";

export interface ItemActionResult {
  readonly outcome: ItemActionOutcome;
  readonly message: string;
}

const EQUIP_OPTIONS = new Set(["equip", "wield", "wear"]);
const EAT_OPTIONS = new Set(["eat", "drink"]);
const GENERIC_NOTHING = "Nothing interesting happens.";

function emitMessage(
  ctx: ItemActionContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  // `entityId` addresses the line to the actor; the interest layer keeps it private.
  ctx.deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

/**
 * Resolve and run the item action. Always returns a result; invalid requests leave all state
 * untouched and only emit a message (the authoritative gate against a misbehaving client).
 */
export function handleItemIntent(
  ctx: ItemActionContext,
  owner: EntityId,
  intent: ItemIntent,
  tick: number,
  serverTime: number,
): ItemActionResult {
  const invalid = (message: string): ItemActionResult => {
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "invalid", message };
  };

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return { outcome: "invalid", message: "" };
  }

  const slot = findSlotByUid(inventory, intent.itemUid);
  if (slot === undefined) {
    // Stale uid: the client referenced an item that is no longer in the slot.
    return invalid(GENERIC_NOTHING);
  }
  const occupant = inventory.slots[slot];
  const def = occupant ? ctx.items.get(occupant.itemId) : undefined;
  if (!occupant || !def) {
    return invalid(GENERIC_NOTHING);
  }

  const actionId = intent.actionId;
  if (actionId === "examine") {
    const message = def.examine;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "examined", message };
  }

  if (actionId === "drop") {
    const beforeQuantity = count(inventory, occupant.itemId);
    const { changes } = removeFromSlot(inventory, slot, occupant.quantity);
    const afterQuantity = count(inventory, occupant.itemId);
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: occupant.itemId,
      quantity: occupant.quantity,
      reason: "inventory_drop",
      beforeQuantity,
      afterQuantity,
      metadata: {
        actionId,
        slot,
        uid: occupant.uid,
      },
    });
    const message = `You drop the ${def.name}.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "dropped", message };
  }

  if (EQUIP_OPTIONS.has(actionId)) {
    if (!def.equipment) {
      return invalid("You can't equip that.");
    }
    const equipmentSlot = def.equipment.slot;
    const equipment = ctx.world.getComponent(owner, "equipment");
    const previousItemId = equipment?.slots[equipmentSlot];
    const beforeEquippedItemQuantity = count(inventory, occupant.itemId);
    const beforePreviousItemQuantity = previousItemId
      ? count(inventory, previousItemId)
      : undefined;
    const result = equipItem({ world: ctx.world, items: ctx.items }, owner, inventory, slot, def);
    if (!result.ok) {
      return invalid("You aren't a high enough level to equip that.");
    }
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
    ctx.deltas.markEntityUpdate(owner, { equipment: equipmentUpdate(result.equipment) });
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: occupant.itemId,
      quantity: occupant.quantity,
      reason: "equipment_equip",
      beforeQuantity: beforeEquippedItemQuantity,
      afterQuantity: count(inventory, occupant.itemId),
      metadata: {
        actionId,
        inventorySlot: slot,
        equipmentSlot,
        uid: occupant.uid,
      },
    });
    if (previousItemId && beforePreviousItemQuantity !== undefined) {
      ctx.itemAudit?.recordForEntity(owner, {
        tick,
        itemId: previousItemId,
        quantity: 1,
        reason: "equipment_swap_out",
        beforeQuantity: beforePreviousItemQuantity,
        afterQuantity: count(inventory, previousItemId),
        metadata: {
          actionId,
          inventorySlot: slot,
          equipmentSlot,
          replacedByItemId: occupant.itemId,
        },
      });
    }
    const message = `You equip the ${def.name}.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "equipped", message };
  }

  if (EAT_OPTIONS.has(actionId)) {
    if (!def.consumable) {
      return invalid(GENERIC_NOTHING);
    }
    const combatant = ctx.world.getComponent(owner, "combatant");
    if (!combatant) {
      // No hitpoints to restore — leave the food untouched rather than wasting it.
      return invalid(GENERIC_NOTHING);
    }
    if (tick < combatant.eatBlockedUntilTick) {
      // Still inside the content-defined eat delay from a recent consume — silently ignore,
      // matching the OSRS feel where over-fast eat clicks are dropped, not punished.
      return { outcome: "invalid", message: "" };
    }

    // Consume one unit now (the food leaves the inventory on the eat tick) and apply the eat
    // delay. The HP restore is deferred to the stat-change phase so a same-tick incoming hit
    // resolves first (POC_SPEC §13.9, §9.1 phase 9 > phase 8).
    const beforeQuantity = count(inventory, occupant.itemId);
    const { changes } = removeFromSlot(inventory, slot, 1);
    const afterQuantity = count(inventory, occupant.itemId);
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
    // Enqueue all consumable effects to be processed in the stat-change phase.
    // Heal is clamped to maxHealth; other effects resolve via their systems.
    const heal = def.consumable.heal;
    if (heal !== undefined) {
      ctx.consumables.enqueueHeal(owner, heal);
    }
    if (def.consumable.curesStatus) {
      ctx.consumables.enqueueCure(owner, def.consumable.curesStatus);
    }
    if (def.consumable.effectType === "apply_status" && def.consumable.statusEffectId) {
      ctx.consumables.enqueueApplyStatus(owner, def.consumable.statusEffectId);
    }
    if (def.consumable.effectType === "boost" && def.consumable.boostsSkill) {
      ctx.consumables.enqueueBoost(
        owner,
        def.consumable.boostsSkill.skillId,
        def.consumable.boostsSkill.boostAmount,
      );
    }
    combatant.eatBlockedUntilTick = tick + def.consumable.consumeTicks;
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: occupant.itemId,
      quantity: 1,
      reason: "consume",
      beforeQuantity,
      afterQuantity,
      metadata: {
        actionId,
        slot,
        uid: occupant.uid,
        heal: heal ?? null,
        consumeTicks: def.consumable.consumeTicks,
      },
    });
    const verb = actionId === "drink" ? "drink" : "eat";
    const message = `You ${verb} the ${def.name}.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "eaten", message };
  }

  if (actionId === "use") {
    // Placeholder: "use on X" targeting is wired in a later epic.
    const message = `You need to use the ${def.name} on something.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "used", message };
  }

  return invalid(GENERIC_NOTHING);
}

/**
 * Unequip the item in the equipment slot at `slotIndex` (canonical {@link EQUIPMENT_SLOTS}
 * order) back into the inventory. Triggered by an equipment-panel UI action. Fails without
 * mutation when the slot is empty or the inventory is full.
 */
export function handleUnequipIntent(
  ctx: ItemActionContext,
  owner: EntityId,
  slotIndex: number,
  tick: number,
  serverTime: number,
): ItemActionResult {
  const inventory = ctx.world.getComponent(owner, "inventory");
  const slotName = EQUIPMENT_SLOTS[slotIndex];
  if (!inventory || slotName === undefined) {
    return { outcome: "invalid", message: "" };
  }

  const equipment = ctx.world.getComponent(owner, "equipment");
  const itemId = equipment?.slots[slotName];
  const beforeQuantity = itemId ? count(inventory, itemId) : undefined;
  const result = unequipSlot({ world: ctx.world, items: ctx.items }, owner, inventory, slotName);
  if (!result.ok) {
    if (result.reason === "inventory_full") {
      const message = "You don't have enough inventory space to do that.";
      emitMessage(ctx, owner, message, serverTime);
      return { outcome: "invalid", message };
    }
    return { outcome: "invalid", message: "" };
  }

  ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
  ctx.deltas.markEntityUpdate(owner, { equipment: equipmentUpdate(result.equipment) });
  ctx.itemAudit?.recordForEntity(owner, {
    tick,
    itemId: result.itemId,
    quantity: 1,
    reason: "equipment_unequip",
    beforeQuantity: beforeQuantity ?? 0,
    afterQuantity: count(inventory, result.itemId),
    metadata: {
      equipmentSlot: slotName,
      slotIndex,
    },
  });
  const name = ctx.items.get(result.itemId)?.name ?? result.itemId;
  const message = `You unequip the ${name}.`;
  emitMessage(ctx, owner, message, serverTime);
  return { outcome: "unequipped", message };
}

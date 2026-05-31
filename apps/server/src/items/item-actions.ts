/**
 * Authoritative item-action dispatch (POC_SPEC §16, §13.9).
 *
 * Routes a client {@link ItemIntent} (an inventory item `uid` + an option verb) to a small
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
import type { EntityId, ItemDef, ItemIntent } from "@old-town/shared";
import type { EquipmentComponent, InventoryComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addItem, buildDelta, catalogFromItems, findSlotByUid, removeFromSlot } from "./inventory";

export interface ItemActionContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  /** Item registry for definition lookups (examine text, equip slot, consumable, stackable). */
  readonly items: ReadonlyMap<string, ItemDef>;
}

/** What the dispatcher did, for callers/tests. `invalid` means no state changed. */
export type ItemActionOutcome = "examined" | "dropped" | "equipped" | "eaten" | "used" | "invalid";

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
  serverTime: number,
): ItemActionResult {
  const invalid = (message: string): ItemActionResult => {
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "invalid", message };
  };

  const inventory = ctx.world.stores.inventory.get(owner);
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

  const option = intent.option;
  if (option === "examine") {
    const message = def.examine;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "examined", message };
  }

  if (option === "drop") {
    const { changes } = removeFromSlot(inventory, slot, occupant.quantity);
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
    const message = `You drop the ${def.name}.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "dropped", message };
  }

  if (EQUIP_OPTIONS.has(option)) {
    if (!def.equipment) {
      return invalid("You can't equip that.");
    }
    const changes = equipFromInventory(ctx, owner, inventory, slot, def);
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
    const message = `You equip the ${def.name}.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "equipped", message };
  }

  if (EAT_OPTIONS.has(option)) {
    if (!def.consumable) {
      return invalid(GENERIC_NOTHING);
    }
    // S02 only consumes the item; S04 adds HP healing, eat delay, and tick-phase priority.
    const { changes } = removeFromSlot(inventory, slot, 1);
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
    const verb = option === "drink" ? "drink" : "eat";
    const message = `You ${verb} the ${def.name}.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "eaten", message };
  }

  if (option === "use") {
    // Placeholder: "use on X" targeting is wired in a later epic.
    const message = `You need to use the ${def.name} on something.`;
    emitMessage(ctx, owner, message, serverTime);
    return { outcome: "used", message };
  }

  return invalid(GENERIC_NOTHING);
}

/**
 * Move an inventory item into its equipment slot, returning the previously-equipped item (if
 * any) to the inventory. Non-lossy: the equipping item frees its slot first, guaranteeing room
 * for the swap-out. Combat-bonus recompute and equipment update masks are added in S03.
 */
function equipFromInventory(
  ctx: ItemActionContext,
  owner: EntityId,
  inventory: InventoryComponent,
  slot: number,
  def: ItemDef,
) {
  const equipment = getOrCreateEquipment(ctx.world, owner);
  const targetSlot = def.equipment?.slot;
  const equippingItemId = inventory.slots[slot]?.itemId;
  if (!targetSlot || !equippingItemId) {
    return [];
  }

  const previousItemId = equipment.slots[targetSlot];

  // Free the equipping item's slot, then settle the swapped-out item into the freed space.
  const { changes } = removeFromSlot(inventory, slot, inventory.slots[slot]?.quantity ?? 0);
  equipment.slots[targetSlot] = equippingItemId;

  if (previousItemId) {
    const catalog = catalogFromItems(ctx.items);
    const { changes: addBack } = addItem(inventory, catalog, previousItemId, 1);
    return [...changes, ...addBack];
  }
  return changes;
}

function getOrCreateEquipment(world: World, owner: EntityId): EquipmentComponent {
  const existing = world.stores.equipment.get(owner);
  if (existing) {
    return existing;
  }
  const created: EquipmentComponent = { entityId: owner, slots: {} };
  world.stores.equipment.set(owner, created);
  return created;
}

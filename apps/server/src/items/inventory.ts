/**
 * Authoritative inventory container operations (POC_SPEC §16.2).
 *
 * The container is a plain {@link InventoryComponent} (28 slots by default). Every mutating
 * function returns the set of {@link InventorySlotChange}s it produced so the caller can feed
 * them to the delta accumulator — the server is the only writer, and the client learns of
 * changes solely through these deltas. Functions are framework-free and registry-free (they
 * take a narrow {@link ItemCatalog}) so they are deterministic and unit-testable in isolation.
 */
import type { EntityId, InventoryDelta, InventorySlotChange } from "@old-town/shared";
import type { InventoryComponent } from "../ecs/components";

/** Classic Int32 stack ceiling for a single stackable slot. */
export const MAX_STACK = 2_147_483_647;

/** Narrow view of item metadata the container needs (decouples it from the full registry). */
export interface ItemCatalog {
  /** Whether an item stacks into one slot, or `undefined` when the item id is unknown. */
  isStackable(itemId: string): boolean | undefined;
}

/** Build an {@link ItemCatalog} from a registry-style map of item definitions. */
export function catalogFromItems(
  items: ReadonlyMap<string, { readonly stackable: boolean }>,
): ItemCatalog {
  return { isStackable: (itemId) => items.get(itemId)?.stackable };
}

export interface AddResult {
  /** How many units were actually added (`< quantity` means the container filled up). */
  readonly added: number;
  readonly changes: InventorySlotChange[];
}

export interface RemoveResult {
  /** How many units were actually removed (`< quantity` means fewer were present). */
  readonly removed: number;
  readonly changes: InventorySlotChange[];
}

/** A required quantity of an item, used by {@link hasAll}. */
export interface ItemRequirement {
  readonly itemId: string;
  readonly quantity: number;
}

/** Create an empty inventory container with `capacity` slots. */
export function createInventory(
  entityId: EntityId,
  containerId: string,
  capacity: number,
): InventoryComponent {
  return {
    entityId,
    containerId,
    capacity,
    slots: Array.from({ length: capacity }, () => undefined),
    nextUid: 1,
  };
}

export function createBank(
  entityId: EntityId,
  capacity: number,
): import("../ecs/components").BankComponent {
  return {
    entityId,
    containerId: "bank",
    capacity,
    slots: Array.from({ length: capacity }, () => undefined),
    nextUid: 1,
  };
}

/** Snapshot one slot as a delta change (`itemId: null` when empty). */
function changeFor(inv: InventoryComponent, slot: number): InventorySlotChange {
  const item = inv.slots[slot];
  if (!item) {
    return { slot, itemId: null, quantity: 0 };
  }
  return { slot, itemId: item.itemId, quantity: item.quantity, uid: item.uid };
}

/** Allocate the next per-container instance uid. */
function allocUid(inv: InventoryComponent): number {
  const uid = inv.nextUid;
  inv.nextUid += 1;
  return uid;
}

/** Index of the first empty slot, or `undefined` if the container is full. */
export function firstFreeSlot(inv: InventoryComponent): number | undefined {
  const cap = inv.capacity;
  for (let slot = 0; slot < cap; slot += 1) {
    if (!inv.slots[slot]) {
      return slot;
    }
  }
  return undefined;
}

/** Number of empty slots. */
export function freeSlotCount(inv: InventoryComponent): number {
  let free = 0;
  const cap = inv.capacity;
  for (let slot = 0; slot < cap; slot += 1) {
    if (!inv.slots[slot]) {
      free += 1;
    }
  }
  return free;
}

/** Total quantity of `itemId` across all slots. */
export function count(inv: InventoryComponent, itemId: string): number {
  let total = 0;
  for (const item of inv.slots) {
    if (item?.itemId === itemId) {
      total += item.quantity;
    }
  }
  return total;
}

/** Whether the container holds at least `quantity` of `itemId`. */
export function hasItem(inv: InventoryComponent, itemId: string, quantity = 1): boolean {
  return count(inv, itemId) >= quantity;
}

/** Whether the container satisfies every requirement (duplicate item ids are summed). */
export function hasAll(inv: InventoryComponent, requirements: readonly ItemRequirement[]): boolean {
  const needed = new Map<string, number>();
  for (const req of requirements) {
    needed.set(req.itemId, (needed.get(req.itemId) ?? 0) + req.quantity);
  }
  for (const [itemId, quantity] of needed) {
    if (count(inv, itemId) < quantity) {
      return false;
    }
  }
  return true;
}

/** Slot index holding the given instance uid, or `undefined`. */
export function findSlotByUid(inv: InventoryComponent, uid: number): number | undefined {
  const cap = inv.capacity;
  for (let slot = 0; slot < cap; slot += 1) {
    if (inv.slots[slot]?.uid === uid) {
      return slot;
    }
  }
  return undefined;
}

/**
 * Whether `quantity` of `itemId` can be added in full given current free space. Atomic check
 * for "inventory full prevents item rewards" — callers can verify before committing a reward.
 */
export function hasSpaceFor(
  inv: InventoryComponent,
  catalog: ItemCatalog,
  itemId: string,
  quantity: number,
): boolean {
  const stackable = catalog.isStackable(itemId);
  if (stackable === undefined) {
    return false;
  }
  if (quantity <= 0) {
    return true;
  }
  if (stackable) {
    return hasItem(inv, itemId) || freeSlotCount(inv) >= 1;
  }
  return freeSlotCount(inv) >= quantity;
}

/**
 * Add up to `quantity` of `itemId`. Stackable items merge into an existing stack (or a new
 * slot); unstackable items each occupy their own slot. Best-effort: stops when the container
 * fills, reporting how many units actually landed. Unknown items add nothing.
 */
export function addItem(
  inv: InventoryComponent,
  catalog: ItemCatalog,
  itemId: string,
  quantity: number,
): AddResult {
  const changes: InventorySlotChange[] = [];
  const stackable = catalog.isStackable(itemId);
  if (stackable === undefined || quantity <= 0) {
    return { added: 0, changes };
  }

  if (stackable) {
    let slot = inv.slots.findIndex((s) => s?.itemId === itemId);
    if (slot < 0) {
      const free = firstFreeSlot(inv);
      if (free === undefined) {
        return { added: 0, changes };
      }
      slot = free;
      inv.slots[slot] = { itemId, quantity: 0, uid: allocUid(inv) };
    }
    const existing = inv.slots[slot];
    if (!existing) {
      return { added: 0, changes };
    }
    const room = MAX_STACK - existing.quantity;
    const added = Math.min(quantity, room);
    existing.quantity += added;
    changes.push(changeFor(inv, slot));
    return { added, changes };
  }

  let remaining = quantity;
  while (remaining > 0) {
    const free = firstFreeSlot(inv);
    if (free === undefined) {
      break;
    }
    inv.slots[free] = { itemId, quantity: 1, uid: allocUid(inv) };
    changes.push(changeFor(inv, free));
    remaining -= 1;
  }
  return { added: quantity - remaining, changes };
}

/** Remove up to `quantity` from a specific slot. Empties the slot when it hits zero. */
export function removeFromSlot(
  inv: InventoryComponent,
  slot: number,
  quantity: number,
): RemoveResult {
  const item = inv.slots[slot];
  if (!item || quantity <= 0) {
    return { removed: 0, changes: [] };
  }
  const removed = Math.min(quantity, item.quantity);
  const remaining = item.quantity - removed;
  inv.slots[slot] = remaining <= 0 ? undefined : { ...item, quantity: remaining };
  return { removed, changes: [changeFor(inv, slot)] };
}

/**
 * Remove up to `quantity` of `itemId`, draining from the lowest slots first. Best-effort:
 * reports how many units were actually removed (callers needing atomic removal should
 * {@link hasItem}-check first).
 */
export function removeItem(
  inv: InventoryComponent,
  itemId: string,
  quantity: number,
): RemoveResult {
  const changes: InventorySlotChange[] = [];
  if (quantity <= 0) {
    return { removed: 0, changes };
  }
  let remaining = quantity;
  for (let slot = 0; slot < inv.capacity && remaining > 0; slot += 1) {
    const item = inv.slots[slot];
    if (!item || item.itemId !== itemId) {
      continue;
    }
    const take = Math.min(remaining, item.quantity);
    const left = item.quantity - take;
    inv.slots[slot] = left <= 0 ? undefined : { ...item, quantity: left };
    changes.push(changeFor(inv, slot));
    remaining -= take;
  }
  return { removed: quantity - remaining, changes };
}

/** Swap the contents of two slots (either may be empty). No-op for equal/out-of-range slots. */
export function swapSlots(inv: InventoryComponent, a: number, b: number): InventorySlotChange[] {
  if (a === b || !inRange(inv, a) || !inRange(inv, b)) {
    return [];
  }
  const tmp = inv.slots[a];
  inv.slots[a] = inv.slots[b];
  inv.slots[b] = tmp;
  return [changeFor(inv, a), changeFor(inv, b)];
}

/**
 * Move the item in `from` onto `to`. Relocates into an empty target, merges into a matching
 * stackable target (overflow stays behind), and otherwise swaps. This is the general
 * drag-and-drop handler for inventory reordering.
 */
export function moveItem(
  inv: InventoryComponent,
  catalog: ItemCatalog,
  from: number,
  to: number,
): InventorySlotChange[] {
  if (from === to || !inRange(inv, from) || !inRange(inv, to)) {
    return [];
  }
  const src = inv.slots[from];
  if (!src) {
    return [];
  }
  const dst = inv.slots[to];
  if (!dst) {
    inv.slots[to] = src;
    inv.slots[from] = undefined;
    return [changeFor(inv, from), changeFor(inv, to)];
  }
  if (dst.itemId === src.itemId && catalog.isStackable(src.itemId) === true) {
    const total = dst.quantity + src.quantity;
    const merged = Math.min(MAX_STACK, total);
    const overflow = total - merged;
    inv.slots[to] = { ...dst, quantity: merged };
    inv.slots[from] = overflow <= 0 ? undefined : { ...src, quantity: overflow };
    return [changeFor(inv, from), changeFor(inv, to)];
  }
  return swapSlots(inv, from, to);
}

function inRange(inv: InventoryComponent, slot: number): boolean {
  return Number.isInteger(slot) && slot >= 0 && slot < inv.capacity;
}

/** Wrap a set of slot changes in a container-tagged {@link InventoryDelta}. */
export function buildDelta(
  inv: InventoryComponent,
  changes: readonly InventorySlotChange[],
): InventoryDelta {
  return { containerId: inv.containerId, changes: [...changes] };
}

/** Full snapshot of every occupied slot as delta changes (for initial full-state sync). */
export function snapshotChanges(inv: InventoryComponent): InventorySlotChange[] {
  const changes: InventorySlotChange[] = [];
  const cap = inv.capacity;
  for (let slot = 0; slot < cap; slot += 1) {
    if (inv.slots[slot]) {
      changes.push(changeFor(inv, slot));
    }
  }
  return changes;
}

/** Full-state {@link InventoryDelta} describing the entire container. */
export function toInventoryDelta(inv: InventoryComponent): InventoryDelta {
  return { containerId: inv.containerId, changes: snapshotChanges(inv) };
}

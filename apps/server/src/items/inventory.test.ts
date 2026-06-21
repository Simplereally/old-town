import { entityId, INVENTORY_SIZE } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  addItem,
  catalogFromItems,
  count,
  createInventory,
  findSlotByUid,
  firstFreeSlot,
  freeSlotCount,
  hasAll,
  hasItem,
  hasSpaceFor,
  type ItemCatalog,
  MAX_STACK,
  moveItem,
  removeFromSlot,
  removeItem,
  snapshotChanges,
  swapSlots,
  toInventoryDelta,
} from "./inventory";

// dry_log / oak_log stack; axe / pickaxe do not. "ghost_item" is intentionally unknown.
const catalog: ItemCatalog = catalogFromItems(
  new Map([
    ["dry_log", { stackable: true }],
    ["oak_log", { stackable: true }],
    ["pennywrought_axe", { stackable: false }],
    ["pennywrought_pickaxe", { stackable: false }],
  ]),
);

const owner = entityId(1);
const makeInv = (capacity = INVENTORY_SIZE) => createInventory(owner, "inventory:1", capacity);

describe("createInventory", () => {
  it("creates an empty container of the requested size", () => {
    const inv = makeInv(28);
    expect(inv.capacity).toBe(28);
    expect(inv.slots).toHaveLength(28);
    expect(inv.slots.every((s) => s === undefined)).toBe(true);
    expect(firstFreeSlot(inv)).toBe(0);
    expect(freeSlotCount(inv)).toBe(28);
  });

  it("uses the canonical 28-slot inventory size by default", () => {
    expect(INVENTORY_SIZE).toBe(28);
    expect(makeInv().capacity).toBe(28);
  });
});

describe("addItem — unstackable", () => {
  it("places one item per slot and assigns ascending uids", () => {
    const inv = makeInv();
    const a = addItem(inv, catalog, "pennywrought_axe", 1);
    const b = addItem(inv, catalog, "pennywrought_pickaxe", 1);

    expect(a).toEqual({
      added: 1,
      changes: [{ slot: 0, itemId: "pennywrought_axe", quantity: 1, uid: 1 }],
    });
    expect(b).toEqual({
      added: 1,
      changes: [{ slot: 1, itemId: "pennywrought_pickaxe", quantity: 1, uid: 2 }],
    });
  });

  it("spreads a multi-quantity add across separate slots", () => {
    const inv = makeInv();
    const result = addItem(inv, catalog, "pennywrought_axe", 3);
    expect(result.added).toBe(3);
    expect(result.changes.map((c) => c.slot)).toEqual([0, 1, 2]);
    expect(result.changes.map((c) => c.uid)).toEqual([1, 2, 3]);
    expect(count(inv, "pennywrought_axe")).toBe(3);
  });
});

describe("addItem — stackable", () => {
  it("merges into a single slot and keeps the same uid", () => {
    const inv = makeInv();
    const first = addItem(inv, catalog, "dry_log", 5);
    const second = addItem(inv, catalog, "dry_log", 7);

    expect(first.changes).toEqual([{ slot: 0, itemId: "dry_log", quantity: 5, uid: 1 }]);
    expect(second.changes).toEqual([{ slot: 0, itemId: "dry_log", quantity: 12, uid: 1 }]);
    expect(count(inv, "dry_log")).toBe(12);
    expect(freeSlotCount(inv)).toBe(INVENTORY_SIZE - 1);
  });

  it("caps a single stack at MAX_STACK and reports the shortfall", () => {
    const inv = makeInv();
    addItem(inv, catalog, "dry_log", MAX_STACK);
    const overflow = addItem(inv, catalog, "dry_log", 10);
    expect(overflow.added).toBe(0);
    expect(count(inv, "dry_log")).toBe(MAX_STACK);
  });
});

describe("addItem — guards", () => {
  it("adds nothing for an unknown item", () => {
    const inv = makeInv();
    expect(addItem(inv, catalog, "ghost_item", 1)).toEqual({ added: 0, changes: [] });
  });

  it("adds nothing for a non-positive quantity", () => {
    const inv = makeInv();
    expect(addItem(inv, catalog, "dry_log", 0).added).toBe(0);
    expect(addItem(inv, catalog, "dry_log", -3).added).toBe(0);
  });
});

describe("full inventory", () => {
  it("prevents new unstackable rewards once every slot is taken", () => {
    const inv = makeInv(2);
    addItem(inv, catalog, "pennywrought_axe", 1);
    addItem(inv, catalog, "pennywrought_pickaxe", 1);

    expect(firstFreeSlot(inv)).toBeUndefined();
    const blocked = addItem(inv, catalog, "pennywrought_axe", 1);
    expect(blocked).toEqual({ added: 0, changes: [] });
  });

  it("partially fills the last free slots and reports the shortfall", () => {
    const inv = makeInv(2);
    addItem(inv, catalog, "pennywrought_axe", 1);
    const result = addItem(inv, catalog, "pennywrought_pickaxe", 3);
    expect(result.added).toBe(1);
    expect(result.changes).toHaveLength(1);
  });

  it("still merges a stackable item into its existing stack when otherwise full", () => {
    const inv = makeInv(1);
    addItem(inv, catalog, "dry_log", 4);
    expect(firstFreeSlot(inv)).toBeUndefined();

    expect(hasSpaceFor(inv, catalog, "dry_log", 10)).toBe(true);
    expect(hasSpaceFor(inv, catalog, "oak_log", 1)).toBe(false);
    const result = addItem(inv, catalog, "dry_log", 10);
    expect(result.added).toBe(10);
    expect(count(inv, "dry_log")).toBe(14);
  });
});

describe("hasSpaceFor", () => {
  it("rejects unknown items and respects free-slot counts", () => {
    const inv = makeInv(2);
    expect(hasSpaceFor(inv, catalog, "ghost_item", 1)).toBe(false);
    expect(hasSpaceFor(inv, catalog, "pennywrought_axe", 2)).toBe(true);
    expect(hasSpaceFor(inv, catalog, "pennywrought_axe", 3)).toBe(false);
    expect(hasSpaceFor(inv, catalog, "dry_log", 999)).toBe(true);
  });
});

describe("count / hasItem / hasAll", () => {
  it("counts across stacks and slots", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 2);
    addItem(inv, catalog, "dry_log", 30);

    expect(count(inv, "pennywrought_axe")).toBe(2);
    expect(count(inv, "dry_log")).toBe(30);
    expect(count(inv, "oak_log")).toBe(0);
    expect(hasItem(inv, "dry_log", 30)).toBe(true);
    expect(hasItem(inv, "dry_log", 31)).toBe(false);
  });

  it("sums duplicate requirements in hasAll", () => {
    const inv = makeInv();
    addItem(inv, catalog, "dry_log", 3);
    expect(hasAll(inv, [{ itemId: "dry_log", quantity: 3 }])).toBe(true);
    expect(
      hasAll(inv, [
        { itemId: "dry_log", quantity: 2 },
        { itemId: "dry_log", quantity: 2 },
      ]),
    ).toBe(false);
  });
});

describe("removeItem / removeFromSlot", () => {
  it("drains a stack and empties the slot at zero", () => {
    const inv = makeInv();
    addItem(inv, catalog, "dry_log", 10);
    const result = removeItem(inv, "dry_log", 10);

    expect(result.removed).toBe(10);
    expect(result.changes).toEqual([{ slot: 0, itemId: null, quantity: 0 }]);
    expect(count(inv, "dry_log")).toBe(0);
    expect(firstFreeSlot(inv)).toBe(0);
  });

  it("removes across multiple unstackable slots", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 3);
    const result = removeItem(inv, "pennywrought_axe", 2);
    expect(result.removed).toBe(2);
    expect(count(inv, "pennywrought_axe")).toBe(1);
  });

  it("reports a shortfall when removing more than is present (remove failure)", () => {
    const inv = makeInv();
    addItem(inv, catalog, "dry_log", 4);
    const result = removeItem(inv, "dry_log", 10);
    expect(result.removed).toBe(4);
    expect(count(inv, "dry_log")).toBe(0);
  });

  it("removes nothing for an absent item", () => {
    const inv = makeInv();
    expect(removeItem(inv, "oak_log", 5)).toEqual({ removed: 0, changes: [] });
  });

  it("removeFromSlot reduces quantity in place", () => {
    const inv = makeInv();
    addItem(inv, catalog, "dry_log", 8);
    const result = removeFromSlot(inv, 0, 3);
    expect(result.removed).toBe(3);
    expect(result.changes).toEqual([{ slot: 0, itemId: "dry_log", quantity: 5, uid: 1 }]);
  });
});

describe("swapSlots", () => {
  it("swaps two occupied slots", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1); // slot 0, uid 1
    addItem(inv, catalog, "pennywrought_pickaxe", 1); // slot 1, uid 2

    const changes = swapSlots(inv, 0, 1);
    expect(changes).toEqual([
      { slot: 0, itemId: "pennywrought_pickaxe", quantity: 1, uid: 2 },
      { slot: 1, itemId: "pennywrought_axe", quantity: 1, uid: 1 },
    ]);
  });

  it("relocates when swapping an occupied slot with an empty one", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1); // slot 0
    const changes = swapSlots(inv, 0, 5);
    expect(changes).toEqual([
      { slot: 0, itemId: null, quantity: 0 },
      { slot: 5, itemId: "pennywrought_axe", quantity: 1, uid: 1 },
    ]);
  });

  it("is a no-op for equal or out-of-range slots", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1);
    expect(swapSlots(inv, 0, 0)).toEqual([]);
    expect(swapSlots(inv, 0, 999)).toEqual([]);
    expect(swapSlots(inv, -1, 0)).toEqual([]);
  });
});

describe("moveItem", () => {
  it("relocates into an empty target", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1);
    const changes = moveItem(inv, catalog, 0, 4);
    expect(changes).toEqual([
      { slot: 0, itemId: null, quantity: 0 },
      { slot: 4, itemId: "pennywrought_axe", quantity: 1, uid: 1 },
    ]);
  });

  it("merges matching stackable items, leaving overflow behind", () => {
    const inv = makeInv();
    inv.slots[0] = { itemId: "dry_log", quantity: MAX_STACK - 2, uid: 10 };
    inv.slots[1] = { itemId: "dry_log", quantity: 5, uid: 11 };
    inv.nextUid = 12;

    const changes = moveItem(inv, catalog, 1, 0);
    expect(inv.slots[0]?.quantity).toBe(MAX_STACK);
    expect(inv.slots[0]?.uid).toBe(10);
    expect(inv.slots[1]?.quantity).toBe(3);
    expect(changes).toHaveLength(2);
  });

  it("swaps when targets hold different items", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1); // slot 0
    addItem(inv, catalog, "pennywrought_pickaxe", 1); // slot 1
    moveItem(inv, catalog, 0, 1);
    expect(inv.slots[0]?.itemId).toBe("pennywrought_pickaxe");
    expect(inv.slots[1]?.itemId).toBe("pennywrought_axe");
  });

  it("does not merge two unstackable items with the same id (swaps instead)", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 2); // slots 0 and 1, uids 1 and 2
    const changes = moveItem(inv, catalog, 0, 1);
    expect(inv.slots[0]?.quantity).toBe(1);
    expect(inv.slots[1]?.quantity).toBe(1);
    expect(changes).toHaveLength(2);
  });

  it("is a no-op when the source slot is empty", () => {
    const inv = makeInv();
    expect(moveItem(inv, catalog, 3, 4)).toEqual([]);
  });
});

describe("uid stability and lookup", () => {
  it("keeps an instance uid attached across a move", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1); // uid 1 at slot 0
    moveItem(inv, catalog, 0, 9);
    expect(findSlotByUid(inv, 1)).toBe(9);
    expect(findSlotByUid(inv, 999)).toBeUndefined();
  });
});

describe("snapshot / delta", () => {
  it("snapshots only occupied slots and tags the container", () => {
    const inv = makeInv();
    addItem(inv, catalog, "pennywrought_axe", 1);
    addItem(inv, catalog, "dry_log", 12);

    expect(snapshotChanges(inv)).toEqual([
      { slot: 0, itemId: "pennywrought_axe", quantity: 1, uid: 1 },
      { slot: 1, itemId: "dry_log", quantity: 12, uid: 2 },
    ]);
    expect(toInventoryDelta(inv).containerId).toBe("inventory:1");
  });
});

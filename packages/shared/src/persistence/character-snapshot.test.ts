import { describe, expect, it } from "vitest";
import {
  CHARACTER_SNAPSHOT_VERSION,
  characterSnapshotSchema,
  isCharacterSnapshot,
  parseCharacterSnapshot,
} from "./character-snapshot";

const validSnapshot = {
  version: CHARACTER_SNAPSHOT_VERSION,
  characterId: "dev-a",
  savedAt: 1_700_000_000,
  position: { x: 30, y: 32, plane: 0 },
  hitpoints: { health: 10, maxHealth: 10 },
  skills: {
    cooking: { level: 3, xp: 125, boost: 0, drain: 0 },
  },
  inventory: {
    containerId: "inventory:dev-a",
    capacity: 28,
    nextUid: 3,
    slots: [
      { slot: 0, itemId: "bread", quantity: 5, uid: 1 },
      { slot: 4, itemId: "coin", quantity: 25, uid: 2 },
    ],
  },
  equipment: { slots: { weapon: "pennywrought_shortblade" } },
  vars: {
    "quest.smoke_over_old_town.stage": 40,
    "quest.smoke_over_old_town.completed": false,
    "quest.points": 1,
  },
  bank: { slots: [{ slot: 0, itemId: "dry_log", quantity: 10, uid: 1 }] },
};

describe("characterSnapshotSchema", () => {
  it("accepts a valid persistence snapshot", () => {
    expect(characterSnapshotSchema.safeParse(validSnapshot).success).toBe(true);
  });

  it("rejects duplicate inventory slots and duplicate uids", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      inventory: {
        ...validSnapshot.inventory,
        slots: [
          { slot: 0, itemId: "bread", quantity: 1, uid: 1 },
          { slot: 0, itemId: "coin", quantity: 1, uid: 1 },
        ],
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected duplicate inventory snapshot to fail validation");
    }
    expect(result.error.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining(["duplicate inventory slot 0", "duplicate inventory uid 1"]),
    );
  });

  it("rejects invalid hitpoint and tile truth", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      position: { x: 30.5, y: 32, plane: 0 },
      hitpoints: { health: 11, maxHealth: 10 },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected invalid snapshot to fail validation");
    }
    expect(result.error.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Expected integer, received float",
        "health cannot exceed maxHealth",
      ]),
    );
  });

  it("accepts fractional skill XP (OSRS hitpoints XP is 1.33/damage)", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      skills: {
        hitpoints: { level: 1, xp: 3.99, boost: 0, drain: 0 },
        cooking: { level: 3, xp: 125.5, boost: 0, drain: 0 },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative skill XP", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      skills: { cooking: { level: 3, xp: -1, boost: 0, drain: 0 } },
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer skill level even when XP is fractional", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      skills: { hitpoints: { level: 10.5, xp: 3.99, boost: 0, drain: 0 } },
    });

    expect(result.success).toBe(false);
  });

  it("rejects an inventory slot outside capacity", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      inventory: {
        ...validSnapshot.inventory,
        slots: [{ slot: 28, itemId: "bread", quantity: 1, uid: 3 }],
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("outside capacity"))).toBe(true);
    }
  });

  it("rejects nextUid not greater than the highest item uid", () => {
    const result = characterSnapshotSchema.safeParse({
      ...validSnapshot,
      inventory: {
        containerId: "inventory:dev-a",
        capacity: 28,
        nextUid: 2,
        slots: [{ slot: 0, itemId: "bread", quantity: 1, uid: 2 }],
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("nextUid"))).toBe(true);
    }
  });

  it("rejects a wrong snapshot version", () => {
    const result = characterSnapshotSchema.safeParse({ ...validSnapshot, version: 999 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown top-level field (strict)", () => {
    const result = characterSnapshotSchema.safeParse({ ...validSnapshot, hack: true });
    expect(result.success).toBe(false);
  });

  it("defaults bank to an empty slots array when omitted", () => {
    const { bank, ...withoutBank } = validSnapshot;
    void bank;
    const result = characterSnapshotSchema.safeParse(withoutBank);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bank.slots).toEqual([]);
    }
  });

  it("defaults equipment slots to an empty object when omitted", () => {
    const { equipment, ...withoutEquipment } = validSnapshot;
    void equipment;
    const result = characterSnapshotSchema.safeParse(withoutEquipment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.equipment.slots).toEqual({});
    }
  });
});

describe("parseCharacterSnapshot", () => {
  it("returns the parsed snapshot for valid input", () => {
    const snapshot = parseCharacterSnapshot(validSnapshot);
    expect(snapshot.characterId).toBe("dev-a");
  });

  it("throws for invalid input", () => {
    expect(() => parseCharacterSnapshot({ bad: true })).toThrow();
  });
});

describe("isCharacterSnapshot", () => {
  it("returns true for a valid snapshot", () => {
    expect(isCharacterSnapshot(validSnapshot)).toBe(true);
  });

  it("returns false for an invalid snapshot without throwing", () => {
    expect(isCharacterSnapshot({ bad: true })).toBe(false);
    expect(isCharacterSnapshot(null)).toBe(false);
    expect(isCharacterSnapshot("not-an-object")).toBe(false);
  });
});

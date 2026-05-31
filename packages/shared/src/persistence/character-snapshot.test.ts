import { describe, expect, it } from "vitest";
import { CHARACTER_SNAPSHOT_VERSION, characterSnapshotSchema } from "./character-snapshot";

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
  bank: { slots: [{ slot: 0, itemId: "dry_log", quantity: 10 }] },
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
});

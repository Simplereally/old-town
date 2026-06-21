import { describe, expect, it } from "vitest";
import {
  CollisionFlag,
  COLLISION_FLAG_DESCRIPTORS,
  isValidStaticCollisionMask,
  STATIC_COLLISION_FLAG_DESCRIPTORS,
  STATIC_COLLISION_MASK,
} from "./collision-flags";

describe("shared collision flags", () => {
  it("keeps runtime occupancy bits out of static map masks", () => {
    expect(STATIC_COLLISION_MASK & CollisionFlag.BLOCK_FULL).not.toBe(0);
    expect(STATIC_COLLISION_MASK & CollisionFlag.PROJECTILE_BLOCK).not.toBe(0);
    expect(STATIC_COLLISION_MASK & CollisionFlag.OCCUPIED_PLAYER).toBe(0);
    expect(STATIC_COLLISION_MASK & CollisionFlag.OCCUPIED_NPC).toBe(0);
    expect(STATIC_COLLISION_MASK & CollisionFlag.OCCUPIED_OBJECT).toBe(0);
  });

  it("validates only static map bits for authored region collision", () => {
    const authoredMask = CollisionFlag.BLOCK_EAST | CollisionFlag.BLOCK_LOS_EAST;

    expect(isValidStaticCollisionMask(authoredMask)).toBe(true);
    expect(isValidStaticCollisionMask(authoredMask | CollisionFlag.OCCUPIED_OBJECT)).toBe(false);
    expect(isValidStaticCollisionMask(1 << 30)).toBe(false);
  });

  it("rejects a negative mask", () => {
    expect(isValidStaticCollisionMask(-1)).toBe(false);
  });

  it("rejects a non-integer (float) mask", () => {
    expect(isValidStaticCollisionMask(1.5)).toBe(false);
  });

  it("accepts a zero mask (no flags set is valid)", () => {
    expect(isValidStaticCollisionMask(0)).toBe(true);
  });

  it("exposes descriptors for every static editor flag", () => {
    expect(STATIC_COLLISION_FLAG_DESCRIPTORS.map((descriptor) => descriptor.flag)).toContain(
      CollisionFlag.BLOCK_NORTH,
    );
    expect(STATIC_COLLISION_FLAG_DESCRIPTORS.map((descriptor) => descriptor.flag)).not.toContain(
      CollisionFlag.OCCUPIED_NPC,
    );
  });

  it("provides a descriptor for every CollisionFlag enum member", () => {
    const enumValues = Object.values(CollisionFlag).filter(
      (v): v is number => typeof v === "number",
    );
    const descriptorFlags = new Set(COLLISION_FLAG_DESCRIPTORS.map((d) => d.flag));
    for (const value of enumValues) {
      expect(descriptorFlags.has(value as CollisionFlag)).toBe(true);
    }
  });

  it("marks occupancy flags as non-static and all others as static", () => {
    const occupancyFlags = [
      CollisionFlag.OCCUPIED_PLAYER,
      CollisionFlag.OCCUPIED_NPC,
      CollisionFlag.OCCUPIED_OBJECT,
    ];
    for (const flag of occupancyFlags) {
      const descriptor = COLLISION_FLAG_DESCRIPTORS.find((d) => d.flag === flag);
      expect(descriptor?.staticMap).toBe(false);
    }
    const staticDescriptor = COLLISION_FLAG_DESCRIPTORS.find(
      (d) => d.flag === CollisionFlag.BLOCK_FULL,
    );
    expect(staticDescriptor?.staticMap).toBe(true);
  });
});

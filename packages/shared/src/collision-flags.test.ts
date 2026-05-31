import { describe, expect, it } from "vitest";
import {
  CollisionFlag,
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

  it("exposes descriptors for every static editor flag", () => {
    expect(STATIC_COLLISION_FLAG_DESCRIPTORS.map((descriptor) => descriptor.flag)).toContain(
      CollisionFlag.BLOCK_NORTH,
    );
    expect(STATIC_COLLISION_FLAG_DESCRIPTORS.map((descriptor) => descriptor.flag)).not.toContain(
      CollisionFlag.OCCUPIED_NPC,
    );
  });
});

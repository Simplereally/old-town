import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { getRangedFamilyFactory, RANGED_FAMILIES } from "./index";

function getFactory(familyId: string): () => BufferGeometry {
  const factory = getRangedFamilyFactory(familyId);
  if (!factory) throw new Error(`no factory for ${familyId}`);
  return factory;
}

describe("ranged geometry factories (E41-S04)", () => {
  for (const family of RANGED_FAMILIES) {
    it(`${family.id}: factory returns non-empty BufferGeometry with finite bounds`, () => {
      const geometry = getFactory(family.id)();
      expect(geometry.getAttribute("position").count).toBeGreaterThan(0);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      expect(box).not.toBeNull();
      if (!box) return;
      expect(Number.isFinite(box.min.x)).toBe(true);
      expect(Number.isFinite(box.min.y)).toBe(true);
      expect(Number.isFinite(box.min.z)).toBe(true);
      expect(Number.isFinite(box.max.x)).toBe(true);
      expect(Number.isFinite(box.max.y)).toBe(true);
      expect(Number.isFinite(box.max.z)).toBe(true);
      const sizeX = box.max.x - box.min.x;
      const sizeY = box.max.y - box.min.y;
      const sizeZ = box.max.z - box.min.z;
      expect(sizeX).toBeGreaterThan(0);
      expect(sizeY).toBeGreaterThan(0);
      expect(sizeZ).toBeGreaterThan(0);
    });
  }

  it("getRangedFamilyFactory returns undefined for unknown family", () => {
    expect(getRangedFamilyFactory("nonexistent")).toBeUndefined();
  });

  it("RANGED_FAMILIES has exactly 18 families", () => {
    expect(RANGED_FAMILIES).toHaveLength(18);
  });

  it("has 8 bow, 6 crossbow, 4 thrown families", () => {
    const bows = RANGED_FAMILIES.filter((f) => f.category === "bow");
    const crossbows = RANGED_FAMILIES.filter((f) => f.category === "crossbow");
    const thrown = RANGED_FAMILIES.filter((f) => f.category === "thrown");
    expect(bows).toHaveLength(8);
    expect(crossbows).toHaveLength(6);
    expect(thrown).toHaveLength(4);
  });

  it("handbow is the only 1H crossbow", () => {
    const oneHandedCrossbows = RANGED_FAMILIES.filter(
      (f) => f.category === "crossbow" && !f.twoHanded,
    );
    expect(oneHandedCrossbows).toHaveLength(1);
    expect(oneHandedCrossbows[0]?.id).toBe("handbow");
  });
});

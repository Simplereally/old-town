import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { getRangedArmourFamilyFactory, getRangedArmourSlot, RANGED_ARMOUR_FAMILIES } from "./index";

function getFactory(familyId: string): () => BufferGeometry {
  const factory = getRangedArmourFamilyFactory(familyId);
  if (!factory) throw new Error(`no factory for ${familyId}`);
  return factory;
}

describe("ranged armour geometry factories (E41-S07)", () => {
  for (const family of RANGED_ARMOUR_FAMILIES) {
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

  it("RANGED_ARMOUR_FAMILIES has exactly 6 families", () => {
    expect(RANGED_ARMOUR_FAMILIES).toHaveLength(6);
  });

  it("buckler maps to shield slot", () => {
    expect(getRangedArmourSlot("buckler")).toBe("shield");
  });
});

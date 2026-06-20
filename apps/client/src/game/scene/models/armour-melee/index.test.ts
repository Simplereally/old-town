import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { ARMOUR_FAMILIES, getArmourFamilyFactory, getArmourSlot } from "./index";

function getFactory(familyId: string): () => BufferGeometry {
  const factory = getArmourFamilyFactory(familyId);
  if (!factory) throw new Error(`no factory for ${familyId}`);
  return factory;
}

describe("melee armour geometry factories (E41-S06)", () => {
  for (const family of ARMOUR_FAMILIES) {
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

  it("getArmourFamilyFactory returns undefined for unknown family", () => {
    expect(getArmourFamilyFactory("nonexistent")).toBeUndefined();
  });

  it("ARMOUR_FAMILIES has exactly 9 families", () => {
    expect(ARMOUR_FAMILIES).toHaveLength(9);
  });

  it("helm and greathelm map to head slot", () => {
    expect(getArmourSlot("helm")).toBe("head");
    expect(getArmourSlot("greathelm")).toBe("head");
  });

  it("harness, hauberk, platecoat map to body slot", () => {
    expect(getArmourSlot("harness")).toBe("body");
    expect(getArmourSlot("hauberk")).toBe("body");
    expect(getArmourSlot("platecoat")).toBe("body");
  });

  it("ward maps to shield slot", () => {
    expect(getArmourSlot("ward")).toBe("shield");
  });
});

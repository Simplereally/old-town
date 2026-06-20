import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { getMeleeFamilyFactory, MELEE_FAMILIES } from "./index";

function getFactory(familyId: string): () => BufferGeometry {
  const factory = getMeleeFamilyFactory(familyId);
  if (!factory) throw new Error(`no factory for ${familyId}`);
  return factory;
}

describe("melee geometry factories (E41-S03)", () => {
  for (const family of MELEE_FAMILIES) {
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
      // Non-zero volume
      const sizeX = box.max.x - box.min.x;
      const sizeY = box.max.y - box.min.y;
      const sizeZ = box.max.z - box.min.z;
      expect(sizeX).toBeGreaterThan(0);
      expect(sizeY).toBeGreaterThan(0);
      expect(sizeZ).toBeGreaterThan(0);
    });
  }

  it("reach weapons (spear, billhook, glaive) have taller geometry than 1H weapons", () => {
    const reachFamilies = ["spear", "billhook", "glaive"];
    const oneHandFamilies = ["sticker", "shortblade", "cudgel"];
    for (const familyId of reachFamilies) {
      const geo = getFactory(familyId)();
      geo.computeBoundingBox();
      const box = geo.boundingBox;
      if (!box) continue;
      const height = box.max.y - box.min.y;
      expect(height).toBeGreaterThan(1.0);
    }
    for (const familyId of oneHandFamilies) {
      const geo = getFactory(familyId)();
      geo.computeBoundingBox();
      const box = geo.boundingBox;
      if (!box) continue;
      const height = box.max.y - box.min.y;
      expect(height).toBeLessThan(1.0);
    }
  });

  it("getMeleeFamilyFactory returns undefined for unknown family", () => {
    expect(getMeleeFamilyFactory("nonexistent")).toBeUndefined();
  });

  it("MELEE_FAMILIES has exactly 12 families", () => {
    expect(MELEE_FAMILIES).toHaveLength(12);
  });
});

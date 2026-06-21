import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { ACCESSORY_FAMILIES, getAccessoryFamilyFactory, getAccessorySlot } from "./index";

function getFactory(familyId: string): () => BufferGeometry {
  const factory = getAccessoryFamilyFactory(familyId);
  if (!factory) throw new Error(`no factory for ${familyId}`);
  return factory;
}

describe("accessory geometry factories (E41-S08)", () => {
  for (const family of ACCESSORY_FAMILIES) {
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

  it("ACCESSORY_FAMILIES has exactly 4 visible families", () => {
    expect(ACCESSORY_FAMILIES).toHaveLength(4);
  });

  it("cape maps to back slot", () => {
    expect(getAccessorySlot("cape")).toBe("back");
  });

  it("amulet maps to neck slot", () => {
    expect(getAccessorySlot("amulet")).toBe("neck");
  });

  it("belt maps to waist slot", () => {
    expect(getAccessorySlot("belt")).toBe("waist");
  });

  it("trophy maps to chest slot", () => {
    expect(getAccessorySlot("trophy")).toBe("chest");
  });

  it("ring and charm have no factory (icon-only)", () => {
    expect(getAccessoryFamilyFactory("ring")).toBeUndefined();
    expect(getAccessoryFamilyFactory("charm")).toBeUndefined();
  });
});

import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { getMagicFamilyFactory, MAGIC_FAMILIES } from "./index";

function getFactory(familyId: string): () => BufferGeometry {
  const factory = getMagicFamilyFactory(familyId);
  if (!factory) throw new Error(`no factory for ${familyId}`);
  return factory;
}

describe("magic geometry factories (E41-S05)", () => {
  for (const family of MAGIC_FAMILIES) {
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

  it("getMagicFamilyFactory returns undefined for unknown family", () => {
    expect(getMagicFamilyFactory("nonexistent")).toBeUndefined();
  });

  it("MAGIC_FAMILIES has exactly 6 families", () => {
    expect(MAGIC_FAMILIES).toHaveLength(6);
  });

  it("staff and rod are 2H; focus is off-hand; wand/primer/codex are 1H main", () => {
    const staff = MAGIC_FAMILIES.find((f) => f.id === "staff");
    const rod = MAGIC_FAMILIES.find((f) => f.id === "rod");
    const focus = MAGIC_FAMILIES.find((f) => f.id === "focus");
    const wand = MAGIC_FAMILIES.find((f) => f.id === "wand");
    const primer = MAGIC_FAMILIES.find((f) => f.id === "primer");
    const codex = MAGIC_FAMILIES.find((f) => f.id === "codex");
    expect(staff?.twoHanded).toBe(true);
    expect(rod?.twoHanded).toBe(true);
    expect(focus?.offHand).toBe(true);
    expect(wand?.slot).toBe("main");
    expect(primer?.slot).toBe("main");
    expect(codex?.slot).toBe("main");
  });
});

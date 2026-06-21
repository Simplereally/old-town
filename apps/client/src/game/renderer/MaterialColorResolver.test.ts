import type { MaterialDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { DEFAULT_TERRAIN_COLOR, hexToRgb, MaterialColorResolver } from "./MaterialColorResolver";

function mat(overrides: Partial<MaterialDef> = {}): MaterialDef {
  return {
    id: "m",
    name: "M",
    isWater: false,
    isBridge: false,
    roughness: 0.8,
    category: "misc",
    ...overrides,
  } as MaterialDef;
}

describe("hexToRgb", () => {
  it("extracts normalized r, g, b channels from a 0xRRGGBB integer", () => {
    expect(hexToRgb(0x000000)).toEqual([0, 0, 0]);
    expect(hexToRgb(0xffffff)).toEqual([1, 1, 1]);
    expect(hexToRgb(0xff0000)).toEqual([1, 0, 0]);
    expect(hexToRgb(0x00ff00)).toEqual([0, 1, 0]);
    expect(hexToRgb(0x0000ff)).toEqual([0, 0, 1]);
  });

  it("extracts mid-range values", () => {
    const [r, g, b] = hexToRgb(0x4f8f3a);
    expect(r).toBeCloseTo(0x4f / 255, 5);
    expect(g).toBeCloseTo(0x8f / 255, 5);
    expect(b).toBeCloseTo(0x3a / 255, 5);
  });
});

describe("MaterialColorResolver", () => {
  it("resolve returns the explicit color when the material has one", () => {
    const resolver = new MaterialColorResolver(
      new Map([
        ["grass", mat({ color: 0x4f8f3a })],
        ["water", mat({ color: 0x3f6f9a })],
      ]),
    );
    expect(resolver.resolve("grass")).toBe(0x4f8f3a);
    expect(resolver.resolve("water")).toBe(0x3f6f9a);
  });

  it("resolve falls back to DEFAULT_TERRAIN_COLOR for unknown ids", () => {
    const resolver = new MaterialColorResolver(new Map());
    expect(resolver.resolve("nonexistent")).toBe(DEFAULT_TERRAIN_COLOR);
  });

  it("resolve falls back to default for a material with no color field", () => {
    const resolver = new MaterialColorResolver(new Map([["plain", mat({})]]));
    expect(resolver.resolve("plain")).toBe(DEFAULT_TERRAIN_COLOR);
  });

  it("accepts a plain record as well as a Map", () => {
    const resolver = new MaterialColorResolver({
      grass: mat({ color: 0x123456 }),
    });
    expect(resolver.resolve("grass")).toBe(0x123456);
  });

  it("has reports whether an explicit color exists for the id", () => {
    const resolver = new MaterialColorResolver({
      grass: mat({ color: 0x123456 }),
      plain: mat({}),
    });
    expect(resolver.has("grass")).toBe(true);
    expect(resolver.has("plain")).toBe(false);
    expect(resolver.has("missing")).toBe(false);
  });

  it("toRecord serializes the color map for worker transfer", () => {
    const resolver = new MaterialColorResolver({
      grass: mat({ color: 0x123456 }),
      water: mat({ color: 0x3f6f9a }),
    });
    const record = resolver.toRecord();
    expect(record).toEqual({ grass: 0x123456, water: 0x3f6f9a });
  });

  it("toRecord omits materials without a color", () => {
    const resolver = new MaterialColorResolver({
      grass: mat({ color: 0x123456 }),
      plain: mat({}),
    });
    expect(resolver.toRecord()).toEqual({ grass: 0x123456 });
  });
});

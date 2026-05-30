import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

describe("createRng (deterministic)", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 8 }, () => a.nextFloat());
    const seqB = Array.from({ length: 8 }, () => b.nextFloat());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.nextFloat()).not.toBe(b.nextFloat());
  });

  it("nextFloat stays within [0, 1)", () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i++) {
      const value = rng.nextFloat();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("nextInt stays within the inclusive bounds and hits both ends", () => {
    const rng = createRng(7);
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 2000; i++) {
      const value = rng.nextInt(1, 6);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
      if (value === 1) {
        sawMin = true;
      }
      if (value === 6) {
        sawMax = true;
      }
    }
    expect(sawMin).toBe(true);
    expect(sawMax).toBe(true);
  });

  it("nextInt handles a single-value range", () => {
    const rng = createRng(3);
    expect(rng.nextInt(5, 5)).toBe(5);
  });

  it("throws when nextInt bounds are inverted", () => {
    const rng = createRng(3);
    expect(() => rng.nextInt(10, 1)).toThrow(RangeError);
  });

  it("chanceOneIn(1) is always true and is deterministic", () => {
    const rng = createRng(42);
    expect(rng.chanceOneIn(1)).toBe(true);
    const a = createRng(555);
    const b = createRng(555);
    expect(a.chanceOneIn(20)).toBe(b.chanceOneIn(20));
  });
});

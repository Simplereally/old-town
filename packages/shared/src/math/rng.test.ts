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

  it("throws when chanceOneIn is given a value less than 1", () => {
    const rng = createRng(3);
    expect(() => rng.chanceOneIn(0)).toThrow(RangeError);
    expect(() => rng.chanceOneIn(-5)).toThrow(RangeError);
  });

  it("truncates a non-integer chance toward zero (chanceOneIn(5.9) behaves like 5)", () => {
    const a = createRng(100);
    const b = createRng(100);
    expect(a.chanceOneIn(5.9)).toBe(b.chanceOneIn(5));
  });

  it("chanceOneIn(N) only ever returns true or false (boolean)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      expect(typeof rng.chanceOneIn(10)).toBe("boolean");
    }
  });

  it("nextInt accepts a negative min within an inclusive range", () => {
    const rng = createRng(11);
    for (let i = 0; i < 500; i++) {
      const value = rng.nextInt(-3, 3);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThanOrEqual(3);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("nextInt is deterministic for the same seed across a mixed range", () => {
    const a = createRng(2024);
    const b = createRng(2024);
    const seqA = Array.from({ length: 10 }, () => a.nextInt(-5, 5));
    const seqB = Array.from({ length: 10 }, () => b.nextInt(-5, 5));
    expect(seqA).toEqual(seqB);
  });
});

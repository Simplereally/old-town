import { describe, expect, it } from "vitest";
import {
  MAX_SKILL_LEVEL,
  MAX_SKILL_XP,
  MIN_SKILL_LEVEL,
  XP_TABLE,
  levelForXp,
  xpForLevel,
} from "./xp-table";

describe("xpForLevel — spec checkpoints", () => {
  it("matches the spec-derived table at levels 1, 2, 3, 92, 99", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(83);
    expect(xpForLevel(3)).toBe(174);
    expect(xpForLevel(92)).toBe(6_517_253);
    expect(xpForLevel(99)).toBe(13_034_431);
  });

  it("puts level 92 at roughly half of the XP needed for level 99", () => {
    const half = xpForLevel(99) / 2;
    // Within 1% of the halfway point (community-documented "92 is half of 99").
    expect(Math.abs(xpForLevel(92) - half) / half).toBeLessThan(0.01);
  });

  it("is strictly increasing across the whole range", () => {
    for (let level = MIN_SKILL_LEVEL + 1; level <= MAX_SKILL_LEVEL; level++) {
      expect(xpForLevel(level)).toBeGreaterThan(xpForLevel(level - 1));
    }
  });

  it("rejects out-of-range and non-integer levels", () => {
    expect(() => xpForLevel(0)).toThrow(RangeError);
    expect(() => xpForLevel(100)).toThrow(RangeError);
    expect(() => xpForLevel(1.5)).toThrow(RangeError);
  });
});

describe("XP_TABLE / MAX_SKILL_XP", () => {
  it("is level-indexed with a padding entry at 0", () => {
    expect(XP_TABLE[0]).toBe(0);
    expect(XP_TABLE[1]).toBe(0);
    expect(XP_TABLE[99]).toBe(13_034_431);
    expect(XP_TABLE).toHaveLength(MAX_SKILL_LEVEL + 1);
  });

  it("exposes the level-99 threshold as the skill XP cap", () => {
    expect(MAX_SKILL_XP).toBe(xpForLevel(MAX_SKILL_LEVEL));
  });
});

describe("levelForXp — level lookup from XP", () => {
  it("returns the highest level whose threshold is met", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(82)).toBe(1);
    expect(levelForXp(83)).toBe(2);
    expect(levelForXp(173)).toBe(2);
    expect(levelForXp(174)).toBe(3);
  });

  it("caps at level 99 and never exceeds it", () => {
    expect(levelForXp(13_034_430)).toBe(98);
    expect(levelForXp(13_034_431)).toBe(99);
    expect(levelForXp(200_000_000)).toBe(99);
  });

  it("round-trips: levelForXp(xpForLevel(L)) === L for every level", () => {
    for (let level = MIN_SKILL_LEVEL; level <= MAX_SKILL_LEVEL; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });

  it("rejects negative or non-finite XP", () => {
    expect(() => levelForXp(-1)).toThrow(RangeError);
    expect(() => levelForXp(Number.NaN)).toThrow(RangeError);
    expect(() => levelForXp(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

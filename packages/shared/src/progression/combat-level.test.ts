import { describe, expect, it } from "vitest";
import {
  COMBAT_LEVEL_COLORS,
  type CombatLevelInput,
  combatLevelColor,
  combatLevelFromLevels,
} from "./combat-level";

describe("combatLevelColor", () => {
  it("returns plain yellow when either level is missing", () => {
    expect(combatLevelColor(undefined, 10)).toBe(COMBAT_LEVEL_COLORS.yellow);
    expect(combatLevelColor(10, undefined)).toBe(COMBAT_LEVEL_COLORS.yellow);
    expect(combatLevelColor(undefined, undefined)).toBe(COMBAT_LEVEL_COLORS.yellow);
  });

  it("returns true yellow when levels are equal", () => {
    expect(combatLevelColor(50, 50)).toBe(COMBAT_LEVEL_COLORS.yellow);
  });

  it("colours NPC-lower bands by the OSRS thresholds", () => {
    expect(combatLevelColor(50, 40)).toBe(COMBAT_LEVEL_COLORS.deepGreen); // diff -10
    expect(combatLevelColor(50, 41)).toBe(COMBAT_LEVEL_COLORS.lightGreen); // diff -9
    expect(combatLevelColor(50, 44)).toBe(COMBAT_LEVEL_COLORS.lightGreen); // diff -6
    expect(combatLevelColor(50, 45)).toBe(COMBAT_LEVEL_COLORS.yellowGreen); // diff -5
    expect(combatLevelColor(50, 49)).toBe(COMBAT_LEVEL_COLORS.yellowGreen); // diff -1
  });

  it("colours NPC-higher bands by the OSRS thresholds", () => {
    expect(combatLevelColor(50, 51)).toBe(COMBAT_LEVEL_COLORS.yellowOrange); // diff +1
    expect(combatLevelColor(50, 55)).toBe(COMBAT_LEVEL_COLORS.yellowOrange); // diff +5
    expect(combatLevelColor(50, 56)).toBe(COMBAT_LEVEL_COLORS.lightOrange); // diff +6
    expect(combatLevelColor(50, 60)).toBe(COMBAT_LEVEL_COLORS.lightOrange); // diff +10
    expect(combatLevelColor(50, 61)).toBe(COMBAT_LEVEL_COLORS.darkOrange); // diff +11
    expect(combatLevelColor(50, 70)).toBe(COMBAT_LEVEL_COLORS.darkOrange); // diff +20
    expect(combatLevelColor(50, 71)).toBe(COMBAT_LEVEL_COLORS.redOrange); // diff +21
    expect(combatLevelColor(50, 100)).toBe(COMBAT_LEVEL_COLORS.redOrange); // diff +50
    expect(combatLevelColor(50, 101)).toBe(COMBAT_LEVEL_COLORS.deepRed); // diff +51
  });
});

describe("combatLevelFromLevels", () => {
  it("defaults missing or non-positive skills to level 1", () => {
    // All skills default to 1: base = 0.25*(1+1+0) = 0.5, melee = 0.325*2 = 0.65
    // level = floor(0.5 + 0.65) = floor(1.15) = 1
    expect(combatLevelFromLevels({})).toBe(1);
  });

  it("treats zero and undefined skills identically (both count as 1)", () => {
    const withZeros: CombatLevelInput = {
      attack: 0,
      strength: 0,
      defence: 0,
      hitpoints: 0,
      magic: 0,
      prayer: 0,
      ranged: 0,
    };
    expect(combatLevelFromLevels(withZeros)).toBe(combatLevelFromLevels({}));
  });

  it("computes a melee-dominated level (melee > range > mage)", () => {
    const level = combatLevelFromLevels({
      attack: 40,
      strength: 40,
      defence: 40,
      hitpoints: 40,
      prayer: 20,
      ranged: 1,
      magic: 1,
    });
    // base = 0.25 * (40 + 40 + floor(20/2)) = 0.25 * 90 = 22.5
    // melee = 0.325 * (40 + 40) = 26
    // range = 0.325 * (floor(1/2) + 1) = 0.325 * 1 = 0.325
    // mage  = 0.325 * (floor(1/2) + 1) = 0.325 * 1 = 0.325
    // level = floor(22.5 + 26) = floor(48.5) = 48
    expect(level).toBe(48);
  });

  it("computes a ranged-dominated level when ranged exceeds melee", () => {
    const level = combatLevelFromLevels({
      attack: 1,
      strength: 1,
      defence: 40,
      hitpoints: 40,
      prayer: 20,
      ranged: 40,
      magic: 1,
    });
    // base = 0.25 * (40 + 40 + 10) = 22.5
    // melee = 0.325 * (1 + 1) = 0.65
    // range = 0.325 * (floor(40/2) + 40) = 0.325 * 60 = 19.5
    // mage  = 0.325 * 1 = 0.325
    // level = floor(22.5 + 19.5) = floor(42) = 42
    expect(level).toBe(42);
  });

  it("computes a magic-dominated level when magic exceeds melee and ranged", () => {
    const level = combatLevelFromLevels({
      attack: 1,
      strength: 1,
      defence: 40,
      hitpoints: 40,
      prayer: 20,
      ranged: 1,
      magic: 40,
    });
    // base = 0.25 * (40 + 40 + 10) = 22.5
    // melee = 0.325 * 2 = 0.65
    // range = 0.325 * 1 = 0.325
    // mage  = 0.325 * (floor(40/2) + 40) = 0.325 * 60 = 19.5
    // level = floor(22.5 + 19.5) = 42
    expect(level).toBe(42);
  });

  it("floors prayer division before adding to base", () => {
    const oddPrayer = combatLevelFromLevels({
      attack: 10,
      strength: 10,
      defence: 10,
      hitpoints: 10,
      prayer: 3,
    });
    const evenPrayer = combatLevelFromLevels({
      attack: 10,
      strength: 10,
      defence: 10,
      hitpoints: 10,
      prayer: 2,
    });
    // floor(3/2) = 1, floor(2/2) = 1 → same base contribution
    expect(oddPrayer).toBe(evenPrayer);
  });

  it("floors the final result (never rounds up)", () => {
    // defence=1, hp=1, prayer=1, attack=1, strength=1
    // base = 0.25 * (1 + 1 + 0) = 0.5
    // melee = 0.325 * 2 = 0.65
    // level = floor(0.5 + 0.65) = floor(1.15) = 1
    expect(
      combatLevelFromLevels({ attack: 1, strength: 1, defence: 1, hitpoints: 1, prayer: 1 }),
    ).toBe(1);
  });

  it("is pure: the same input always yields the same output", () => {
    const input: CombatLevelInput = {
      attack: 50,
      strength: 50,
      defence: 50,
      hitpoints: 50,
      prayer: 25,
      ranged: 50,
      magic: 50,
    };
    expect(combatLevelFromLevels(input)).toBe(combatLevelFromLevels(input));
  });
});

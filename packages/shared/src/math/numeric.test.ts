import { describe, expect, it } from "vitest";
import { chebyshevDistance, clamp, manhattanDistance } from "./numeric";

describe("clamp", () => {
  it("clamps to the inclusive range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
    expect(clamp(0, 0, 0)).toBe(0);
  });

  it("throws when min > max", () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

describe("manhattanDistance", () => {
  it("sums absolute axis deltas", () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    expect(manhattanDistance({ x: 5, y: 5 }, { x: 2, y: 1 })).toBe(7);
  });
});

describe("chebyshevDistance", () => {
  it("takes the max absolute axis delta", () => {
    expect(chebyshevDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(chebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
    expect(chebyshevDistance({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(2);
  });
});

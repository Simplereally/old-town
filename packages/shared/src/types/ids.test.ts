import { describe, expect, it } from "vitest";
import { type EntityId, entityId, type Tick, tick } from "./ids";

describe("entityId", () => {
  it("brands valid non-negative integers", () => {
    const id: EntityId = entityId(42);
    expect(id).toBe(42);
  });

  it("rejects negatives, non-integers, and unsafe integers", () => {
    expect(() => entityId(-1)).toThrow(RangeError);
    expect(() => entityId(1.5)).toThrow(RangeError);
    expect(() => entityId(Number.NaN)).toThrow(RangeError);
    expect(() => entityId(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe("tick", () => {
  it("brands valid non-negative integers", () => {
    const t: Tick = tick(0);
    expect(t).toBe(0);
    expect(tick(1234)).toBe(1234);
  });

  it("rejects negatives and non-integers", () => {
    expect(() => tick(-5)).toThrow(RangeError);
    expect(() => tick(2.2)).toThrow(RangeError);
  });
});

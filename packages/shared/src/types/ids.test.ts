import { describe, expect, it } from "vitest";
import { type EntityId, entityId, type Tick, tick } from "./ids";

describe("entityId", () => {
  it("brands valid non-negative integers", () => {
    const id: EntityId = entityId(42);
    expect(id).toBe(42);
  });

  it("accepts zero as a valid entity id", () => {
    expect(entityId(0)).toBe(0);
  });

  it("accepts the maximum safe integer", () => {
    expect(entityId(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects negatives, non-integers, and unsafe integers", () => {
    expect(() => entityId(-1)).toThrow(RangeError);
    expect(() => entityId(1.5)).toThrow(RangeError);
    expect(() => entityId(Number.NaN)).toThrow(RangeError);
    expect(() => entityId(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });

  it("rejects non-finite values (Infinity)", () => {
    expect(() => entityId(Number.POSITIVE_INFINITY)).toThrow(RangeError);
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

  it("rejects NaN and Infinity", () => {
    expect(() => tick(Number.NaN)).toThrow(RangeError);
    expect(() => tick(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("accepts the maximum safe integer", () => {
    expect(tick(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

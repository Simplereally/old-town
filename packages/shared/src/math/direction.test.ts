import { describe, expect, it } from "vitest";
import {
  Direction,
  directionFromDelta,
  directionToDelta,
  facingFromTo,
  isDiagonalDirection,
} from "./direction";

describe("directionFromDelta", () => {
  it("maps each unit step to the right direction (+x East, +y North)", () => {
    expect(directionFromDelta(0, 1)).toBe(Direction.North);
    expect(directionFromDelta(1, 1)).toBe(Direction.NorthEast);
    expect(directionFromDelta(1, 0)).toBe(Direction.East);
    expect(directionFromDelta(1, -1)).toBe(Direction.SouthEast);
    expect(directionFromDelta(0, -1)).toBe(Direction.South);
    expect(directionFromDelta(-1, -1)).toBe(Direction.SouthWest);
    expect(directionFromDelta(-1, 0)).toBe(Direction.West);
    expect(directionFromDelta(-1, 1)).toBe(Direction.NorthWest);
  });

  it("collapses multi-tile deltas by sign", () => {
    expect(directionFromDelta(5, 9)).toBe(Direction.NorthEast);
    expect(directionFromDelta(-12, 0)).toBe(Direction.West);
  });

  it("collapses negative multi-tile deltas by sign", () => {
    expect(directionFromDelta(-5, -9)).toBe(Direction.SouthWest);
    expect(directionFromDelta(-3, 4)).toBe(Direction.NorthWest);
    expect(directionFromDelta(7, -2)).toBe(Direction.SouthEast);
  });

  it("returns null for a zero delta", () => {
    expect(directionFromDelta(0, 0)).toBeNull();
  });
});

describe("directionToDelta round-trips", () => {
  it("each direction's delta maps back to itself", () => {
    for (const direction of [
      Direction.North,
      Direction.NorthEast,
      Direction.East,
      Direction.SouthEast,
      Direction.South,
      Direction.SouthWest,
      Direction.West,
      Direction.NorthWest,
    ]) {
      const { dx, dy } = directionToDelta(direction);
      expect(directionFromDelta(dx, dy)).toBe(direction);
    }
  });
});

describe("facingFromTo", () => {
  it("faces from one point toward another", () => {
    expect(facingFromTo({ x: 5, y: 5 }, { x: 5, y: 8 })).toBe(Direction.North);
    expect(facingFromTo({ x: 5, y: 5 }, { x: 2, y: 5 })).toBe(Direction.West);
    expect(facingFromTo({ x: 5, y: 5 }, { x: 5, y: 5 })).toBeNull();
  });

  it("faces south-west when the target is down-left", () => {
    expect(facingFromTo({ x: 10, y: 10 }, { x: 3, y: 1 })).toBe(Direction.SouthWest);
  });

  it("faces south-east when the target is down-right", () => {
    expect(facingFromTo({ x: 0, y: 10 }, { x: 7, y: 1 })).toBe(Direction.SouthEast);
  });

  it("faces north-east when the target is up-right", () => {
    expect(facingFromTo({ x: 0, y: 0 }, { x: 7, y: 9 })).toBe(Direction.NorthEast);
  });

  it("faces north-west when the target is up-left", () => {
    expect(facingFromTo({ x: 10, y: 0 }, { x: 3, y: 9 })).toBe(Direction.NorthWest);
  });
});

describe("isDiagonalDirection", () => {
  it("is true only for the four diagonals", () => {
    expect(isDiagonalDirection(Direction.North)).toBe(false);
    expect(isDiagonalDirection(Direction.East)).toBe(false);
    expect(isDiagonalDirection(Direction.NorthEast)).toBe(true);
    expect(isDiagonalDirection(Direction.SouthWest)).toBe(true);
  });

  it("is false for every cardinal direction", () => {
    for (const direction of [Direction.North, Direction.East, Direction.South, Direction.West]) {
      expect(isDiagonalDirection(direction)).toBe(false);
    }
  });

  it("is true for every diagonal direction", () => {
    for (const direction of [
      Direction.NorthEast,
      Direction.SouthEast,
      Direction.SouthWest,
      Direction.NorthWest,
    ]) {
      expect(isDiagonalDirection(direction)).toBe(true);
    }
  });
});

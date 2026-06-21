/**
 * Eight-way tile directions and step deltas.
 * Convention: +x is East, +y is North. Directions are numbered clockwise from North.
 */
import type { Point2 } from "./numeric";

export enum Direction {
  North = 0,
  NorthEast = 1,
  East = 2,
  SouthEast = 3,
  South = 4,
  SouthWest = 5,
  West = 6,
  NorthWest = 7,
}

/** A single-tile step delta. Each component is -1, 0, or 1. */
export interface StepDelta {
  readonly dx: number;
  readonly dy: number;
}

const DELTA_BY_DIRECTION: Readonly<Record<Direction, StepDelta>> = {
  [Direction.North]: { dx: 0, dy: 1 },
  [Direction.NorthEast]: { dx: 1, dy: 1 },
  [Direction.East]: { dx: 1, dy: 0 },
  [Direction.SouthEast]: { dx: 1, dy: -1 },
  [Direction.South]: { dx: 0, dy: -1 },
  [Direction.SouthWest]: { dx: -1, dy: -1 },
  [Direction.West]: { dx: -1, dy: 0 },
  [Direction.NorthWest]: { dx: -1, dy: 1 },
};

/** The unit step delta for a direction. */
export function directionToDelta(direction: Direction): StepDelta {
  return DELTA_BY_DIRECTION[direction];
}

/**
 * The direction implied by a movement delta. Only the sign of each component matters,
 * so multi-tile deltas collapse to the matching 8-way direction. Returns `null` for a
 * zero delta (no movement).
 */
export function directionFromDelta(dx: number, dy: number): Direction | null {
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (sx === 0 && sy === 0) {
    return null;
  }
  if (sy > 0) {
    return sx === 0 ? Direction.North : sx > 0 ? Direction.NorthEast : Direction.NorthWest;
  }
  if (sy < 0) {
    return sx === 0 ? Direction.South : sx > 0 ? Direction.SouthEast : Direction.SouthWest;
  }
  return sx > 0 ? Direction.East : Direction.West;
}

/** The direction to face when looking from `from` toward `to`. `null` if identical. */
export function facingFromTo(from: Point2, to: Point2): Direction | null {
  return directionFromDelta(to.x - from.x, to.y - from.y);
}

/** Whether a direction is diagonal (involves both axes). */
export function isDiagonalDirection(direction: Direction): boolean {
  const { dx, dy } = DELTA_BY_DIRECTION[direction];
  return dx !== 0 && dy !== 0;
}

/** Pure numeric helpers shared by simulation and presentation. */

/** Clamp `value` into the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: min (${min}) must be <= max (${max})`);
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

/** A 2D integer point. {@link import("../types/coords").TileCoord} is structurally assignable. */
export interface Point2 {
  readonly x: number;
  readonly y: number;
}

/** Manhattan (taxicab) distance between two points: `|dx| + |dy|`. */
export function manhattanDistance(a: Point2, b: Point2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Chebyshev (chessboard) distance between two points: `max(|dx|, |dy|)`. */
export function chebyshevDistance(a: Point2, b: Point2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

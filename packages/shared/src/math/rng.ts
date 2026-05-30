/**
 * Deterministic seeded RNG. Systems that need reproducible results (loot rolls, hit
 * rolls, wander) must take an {@link Rng} rather than calling `Math.random`, so tests
 * can pin the seed and replay exact sequences.
 */

export interface Rng {
  /** Next float in [0, 1). */
  nextFloat(): number;
  /** Next integer in the inclusive range [minInclusive, maxInclusive]. */
  nextInt(minInclusive: number, maxInclusive: number): number;
  /** True with probability `1 / chance` (chance >= 1). Useful for "1 in N" rolls. */
  chanceOneIn(chance: number): boolean;
}

/**
 * Mulberry32 — a small, fast, well-distributed 32-bit PRNG. Deterministic: the same
 * seed always yields the same sequence.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  function nextFloat(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  }

  function nextInt(minInclusive: number, maxInclusive: number): number {
    if (maxInclusive < minInclusive) {
      throw new RangeError(`nextInt: max (${maxInclusive}) must be >= min (${minInclusive})`);
    }
    const span = maxInclusive - minInclusive + 1;
    return minInclusive + Math.floor(nextFloat() * span);
  }

  function chanceOneIn(chance: number): boolean {
    if (chance < 1) {
      throw new RangeError(`chanceOneIn: chance (${chance}) must be >= 1`);
    }
    return nextInt(1, Math.trunc(chance)) === 1;
  }

  return { nextFloat, nextInt, chanceOneIn };
}

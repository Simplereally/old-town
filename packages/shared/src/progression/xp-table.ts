/**
 * Skill XP curve and level<->XP helpers (POC_SPEC §15.2).
 *
 * The curve is the RuneScape-style exponential table: cumulative XP for a level is the
 * floored quarter-sum of `floor(lvl + 300 * 2^(lvl/7))` over prior levels. Skill defs
 * reference this table by id ({@link OLDTOWN_DEFAULT_XP_TABLE_ID}); the simulation never
 * hardcodes thresholds — it asks {@link xpForLevel} / {@link levelForXp}.
 *
 * Spec-anchored checkpoints: lvl 2 = 83, lvl 3 = 174, lvl 92 ≈ half of 99, lvl 99 = 13,034,431.
 */

/** The only XP table in the POC; skill defs set `xpTableId` to this literal. */
export const OLDTOWN_DEFAULT_XP_TABLE_ID = "oldtown_default" as const;

/** Lowest skill level. */
export const MIN_SKILL_LEVEL = 1;

/** Highest skill level the curve is defined for. */
export const MAX_SKILL_LEVEL = 99;

/** Raw cumulative-XP formula for reaching `level` (POC_SPEC §15.2). `level <= 1` yields 0. */
function computeCumulativeXp(level: number): number {
  let points = 0;
  for (let lvl = 1; lvl < level; lvl++) {
    points += Math.floor(lvl + 300 * 2 ** (lvl / 7));
  }
  return Math.floor(points / 4);
}

/**
 * Cumulative XP required to reach each level, indexed by level (`XP_TABLE[1] === 0`).
 * Index 0 is a padding entry (also 0) so the array can be indexed directly by level.
 */
export const XP_TABLE: readonly number[] = (() => {
  const table: number[] = [];
  for (let level = 0; level <= MAX_SKILL_LEVEL; level++) {
    table[level] = computeCumulativeXp(level);
  }
  return Object.freeze(table);
})();

/** Total XP required to fully max a skill (cumulative XP at {@link MAX_SKILL_LEVEL}). */
export const MAX_SKILL_XP = XP_TABLE[MAX_SKILL_LEVEL] ?? 0;

function assertValidLevel(level: number): void {
  if (!Number.isInteger(level) || level < MIN_SKILL_LEVEL || level > MAX_SKILL_LEVEL) {
    throw new RangeError(
      `xpForLevel: level must be an integer in [${MIN_SKILL_LEVEL}, ${MAX_SKILL_LEVEL}], got ${level}`,
    );
  }
}

/** Minimum cumulative XP required to be `level`. Throws for out-of-range levels. */
export function xpForLevel(level: number): number {
  assertValidLevel(level);
  return XP_TABLE[level] ?? 0;
}

/**
 * The level a skill is at given cumulative `xp`, clamped to [{@link MIN_SKILL_LEVEL},
 * {@link MAX_SKILL_LEVEL}]. Throws for negative or non-finite XP.
 */
export function levelForXp(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) {
    throw new RangeError(`levelForXp: xp must be a non-negative finite number, got ${xp}`);
  }
  for (let level = MAX_SKILL_LEVEL; level >= MIN_SKILL_LEVEL; level--) {
    const threshold = XP_TABLE[level];
    if (threshold !== undefined && xp >= threshold) {
      return level;
    }
  }
  return MIN_SKILL_LEVEL;
}

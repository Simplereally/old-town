/** Prayer definitions (POC_SPEC §13.8, §17.1).
 *
 * Sourced from the OSRS wiki (Prayer, Praying, Prayer_points, Prayer drain mechanics):
 *  - Prayer points max = Prayer level; stored as a fraction internally.
 *  - Drain resistance = 2 × prayerBonus + 60. Each tick, sum of active prayers' drainEffect
 *    is added to an internal counter; when the counter ≥ resistance, one point is lost and
 *    the counter is decremented by resistance.
 *  - drainEffect is the wiki's per-prayer "drain effect" integer (e.g. Thick Skin = 10,
 *    Protect from Melee = 20). seconds-per-point = 0.6 × (resistance / drainEffect).
 *  - Conflicting prayers: activating one prayer disables others in the same conflict group.
 *    Only Rapid Restore, Rapid Heal, Protect Item, and Preserve have no conflict group.
 */
import { z } from "zod";
import { contentIdSchema, positiveInt } from "./common";

/** The combat stat a prayer modifies, and how. */
export const prayerEffectSchema = z
  .object({
    /** Stat being modified. */
    stat: z.enum(["attack", "strength", "defence", "ranged", "magic", "rangedStrength", "magicDamage"]),
    /** "add" adds a flat level boost; "multiply" scales the effective level by (1 + value). */
    mode: z.enum(["add", "multiply"]),
    /** For "add": whole levels added. For "multiply": fraction (e.g. 0.05 = +5%). */
    value: z.number().nonnegative(),
  })
  .strict();

export type PrayerEffect = z.infer<typeof prayerEffectSchema>;

/** Overhead protection prayers reduce incoming damage by a fraction. */
export const prayerProtectionSchema = z
  .object({
    /** Which incoming damage style this prayer protects against. */
    style: z.enum(["melee", "ranged", "magic"]),
    /** Fraction of damage negated against NPCs (0..1). OSRS: 1.0 for NPCs. */
    npcReduction: z.number().min(0).max(1),
    /** Fraction of damage negated against other players (0..1). OSRS: 0.4 in PvP. */
    playerReduction: z.number().min(0).max(1),
  })
  .strict();

export type PrayerProtection = z.infer<typeof prayerProtectionSchema>;

export const prayerDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    /** Prayer level required to activate. */
    requiredPrayer: positiveInt,
    /** Wiki "drain effect" integer. Higher = faster drain. */
    drainEffect: positiveInt,
    /** Conflict group id. Prayers sharing a group cannot be active simultaneously;
     *  activating one deactivates the others. Absent = no conflicts (always-on-able). */
    conflictGroup: z.string().min(1).optional(),
    /** Stat-boost effects applied while the prayer is active. */
    effects: z.array(prayerEffectSchema).default([]),
    /** Damage protection (overhead prayers). Absent for non-protection prayers. */
    protection: prayerProtectionSchema.optional(),
  })
  .strict();

export type PrayerDef = z.infer<typeof prayerDefSchema>;

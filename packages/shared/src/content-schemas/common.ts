/**
 * Shared Zod fragments for content definitions. Ids are validated against the canonical
 * content-id pattern (E01-S06). Object schemas are `.strict()` so unknown fields are
 * rejected — content typos fail loudly rather than being silently ignored.
 */
import { z } from "zod";
import { CONTENT_ID_PATTERN } from "../content/content-ids";
import { tileCoordSchema } from "../protocol/schema-primitives";

/** A content id string (lowercase snake_case). */
export const contentIdSchema = z
  .string()
  .regex(CONTENT_ID_PATTERN, "must be lowercase snake_case content id");

/** A non-negative integer. */
export const nonNegInt = z.number().int().nonnegative();

/** A non-negative finite number (may be fractional). Used for cumulative XP,
 *  which OSRS accumulates as a float (e.g. 1.33 XP/damage → 3.99 for a 3-damage
 *  hit) and the DB stores as `numeric(20, 4)`. The derived `level` is always an
 *  integer via `levelForXp`, but the raw `xp` counter is not. */
export const nonNegNumber = z.number().finite().nonnegative();

/** A positive integer (>= 1). */
export const positiveInt = z.number().int().positive();

/** A quantity of a specific item. */
export const itemQuantitySchema = z
  .object({ itemId: contentIdSchema, quantity: positiveInt })
  .strict();

/** An inclusive integer range, `max >= min`. */
export const rangeSchema = z
  .object({ min: z.number().int(), max: z.number().int() })
  .strict()
  .refine((r) => r.max >= r.min, { message: "range max must be >= min" });

/** A required skill level. */
export const skillRequirementSchema = z
  .object({ skillId: contentIdSchema, level: positiveInt })
  .strict();

/** A typed player var value used by requirements and constrained content effects. */
export const playerVarValueSchema = z.union([z.number().int(), z.boolean(), z.string()]);

/** The eleven equipment slots (POC_SPEC §16.3). */
export const equipmentSlotSchema = z.enum([
  "head",
  "cape",
  "neck",
  "weapon",
  "body",
  "shield",
  "legs",
  "hands",
  "feet",
  "ring",
  "ammo",
]);

/** Combat attack styles (POC_SPEC §13.1). */
export const combatStyleSchema = z.enum(["stab", "slash", "crush", "ranged", "magic"]);

/** A melee/ranged/magic attack style. Determines the attack/defence bonus used and,
 *  via the style→skill map, which combat skill receives XP. */
export type CombatStyle = z.infer<typeof combatStyleSchema>;

/**
 * Combat style mode (POC_SPEC §13.5.2). Determines how combat XP is distributed
 * across skills for a given hit style. OSRS wiki (Combat §Experience gain):
 *  - `accurate`: full XP to the style's primary skill (melee Attack / Ranged / Magic).
 *  - `aggressive`: full XP to Strength (melee only).
 *  - `defensive`: full XP to Defence (melee only).
 *  - `controlled`: split 1.33 each to Attack, Strength, Defence (shared melee weapons).
 *  - `longrange`: split 2 Ranged + 2 Defence (ranged), or 1.33 Magic + 1 Defence (magic).
 */
export const combatStyleModeSchema = z.enum([
  "accurate",
  "aggressive",
  "defensive",
  "controlled",
  "longrange",
]);

export type CombatStyleMode = z.infer<typeof combatStyleModeSchema>;

/** Combat class an item belongs to (`docs/*-tiers.md`). */
export const combatClassSchema = z.enum(["melee", "ranged", "magic"]);

/**
 * Tier-ladder order (0..12) shared by melee, ranged, and magic gear
 * (`docs/melee-armour-tiers.md`, `ranged-tiers.md`, `magic-tiers.md`).
 * 0 = Cobbled (tutorial trash), 12 = Starfall (mythic).
 */
export const tierOrderSchema = z.number().int().min(0).max(12);

/** Live combat stats (POC_SPEC §13.1). */
export const combatStatsSchema = z
  .object({
    attack: nonNegInt,
    strength: nonNegInt,
    defence: nonNegInt,
    ranged: nonNegInt,
    magic: nonNegInt,
    prayer: nonNegInt,
    hitpoints: positiveInt,
  })
  .strict();

/** Equipment combat bonuses (POC_SPEC §13.1). All optional; absent = 0. */
export const combatBonusesSchema = z
  .object({
    stabAttack: z.number().int().optional(),
    slashAttack: z.number().int().optional(),
    crushAttack: z.number().int().optional(),
    magicAttack: z.number().int().optional(),
    rangedAttack: z.number().int().optional(),
    stabDefence: z.number().int().optional(),
    slashDefence: z.number().int().optional(),
    crushDefence: z.number().int().optional(),
    magicDefence: z.number().int().optional(),
    rangedDefence: z.number().int().optional(),
    meleeStrength: z.number().int().optional(),
    rangedStrength: z.number().int().optional(),
    magicDamage: z.number().int().optional(),
    prayer: z.number().int().optional(),
  })
  .strict();

/**
 * A generic, constrained content effect (POC_SPEC §28.4). Quests/dialogue mutate state
 * only through these typed effects — never arbitrary scripts.
 */
export const effectSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("add_item"), itemId: contentIdSchema, quantity: positiveInt })
    .strict(),
  z
    .object({ kind: z.literal("remove_item"), itemId: contentIdSchema, quantity: positiveInt })
    .strict(),
  z.object({ kind: z.literal("add_xp"), skillId: contentIdSchema, amount: positiveInt }).strict(),
  z
    .object({ kind: z.literal("set_var"), key: z.string().min(1), value: playerVarValueSchema })
    .strict(),
  z.object({ kind: z.literal("start_quest"), questId: contentIdSchema }).strict(),
  z.object({ kind: z.literal("complete_quest"), questId: contentIdSchema }).strict(),
  z.object({ kind: z.literal("send_message"), text: z.string().min(1).max(256) }).strict(),
  z.object({ kind: z.literal("unlock"), unlockId: contentIdSchema }).strict(),
  z.object({ kind: z.literal("teleport"), tile: tileCoordSchema }).strict(),
]);

/** A condition that gates quest start, dialogue options, or stage progress. */
export const requirementSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("skill"), skillId: contentIdSchema, level: positiveInt }).strict(),
  z
    .object({ kind: z.literal("quest_stage"), questId: contentIdSchema, minStage: nonNegInt })
    .strict(),
  z
    .object({
      kind: z.literal("kill_count"),
      questId: contentIdSchema,
      npcId: contentIdSchema,
      count: positiveInt,
    })
    .strict(),
  z
    .object({
      kind: z.literal("var"),
      key: z.string().min(1),
      op: z.enum(["eq", "neq", "gte", "lte", "gt", "lt"]),
      value: playerVarValueSchema,
    })
    .strict(),
  z.object({ kind: z.literal("item"), itemId: contentIdSchema, quantity: positiveInt }).strict(),
]);

export type Effect = z.infer<typeof effectSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type ItemQuantity = z.infer<typeof itemQuantitySchema>;
export type CombatStats = z.infer<typeof combatStatsSchema>;
export type CombatBonuses = z.infer<typeof combatBonusesSchema>;

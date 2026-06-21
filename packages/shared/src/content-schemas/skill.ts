/** Skill definitions (POC_SPEC §15.3). */
import { z } from "zod";
import { OLDTOWN_DEFAULT_XP_TABLE_ID } from "../progression/xp-table";
import { contentIdSchema, positiveInt } from "./common";

/** A milestone unlocked at a skill level. */
export const skillUnlockSchema = z
  .object({
    level: positiveInt,
    description: z.string().min(1),
    /** Optional content unlocked (item/object/spell/etc.). */
    unlockId: contentIdSchema.optional(),
  })
  .strict();

export const skillDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    maxLevel: positiveInt.default(99),
    /** Id of the XP table to use for level/XP conversion. */
    xpTableId: z.literal(OLDTOWN_DEFAULT_XP_TABLE_ID),
    /** Whether the skill contributes to combat level. */
    combat: z.boolean().default(false),
    unlocks: z.array(skillUnlockSchema).default([]),
  })
  .strict();

export type SkillDef = z.infer<typeof skillDefSchema>;
export type SkillUnlock = z.infer<typeof skillUnlockSchema>;

/** Boss definitions (POC_SPEC §42). */
import { z } from "zod";
import { contentIdSchema, nonNegInt, requirementSchema } from "./common";

export const bossCategorySchema = z.enum([
  "starter",
  "area",
  "warden",
  "skilling",
  "quest",
  "lair",
  "roaming",
  "duel",
]);

export const bossMechanicKindSchema = z.enum([
  "add_spawn",
  "safe_tile",
  "interrupt",
  "shield_phase",
  "enrage",
  "prep_item",
  "hazard_pulse",
  "style_swap",
  "resource_object",
  "kill_proof",
]);

export const bossLairTypeSchema = z.enum([
  "room",
  "cave",
  "clearing",
  "arena",
  "water_edge",
  "tunnel",
  "rafters",
]);

export const bossLairThresholdSchema = z.enum([
  "door",
  "gate",
  "line",
  "warning",
  "sound",
  "light",
]);

export const bossSafeRatingSchema = z.enum(["safe", "risky", "dangerous"]);

export const bossMechanicSchema = z
  .object({
    kind: bossMechanicKindSchema,
    description: z.string().min(1),
  })
  .strict();

export const bossLairSchema = z
  .object({
    type: bossLairTypeSchema,
    threshold: bossLairThresholdSchema,
    area: z.string().min(1),
    safeRating: bossSafeRatingSchema,
  })
  .strict();

export const bossCombatLevelBandSchema = z
  .object({
    low: nonNegInt,
    high: nonNegInt,
  })
  .strict()
  .refine((r) => r.high >= r.low, {
    message: "combat level band high must be >= low",
  });

export const bossDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    category: bossCategorySchema,
    /** Reference to the NPC definition that defines the creature stats. */
    npcId: contentIdSchema,
    combatLevelBand: bossCombatLevelBandSchema,
    accessRequirements: z.array(requirementSchema).default([]),
    mechanics: z.array(bossMechanicSchema).default([]),
    lair: bossLairSchema,
    /** Reference to the drop table rolled on death. */
    dropTableId: contentIdSchema,
    /** Optional trophy item that drops as proof of defeat. */
    trophyId: contentIdSchema.optional(),
    /** Item ids that are unique to this boss (for validation / reference). */
    uniqueDropIds: z.array(contentIdSchema).default([]),
    failureState: z.string().min(1),
    whatItTeaches: z.string().min(1),
    whatItDoesNotReplace: z.string().min(1),
  })
  .strict();

export type BossDef = z.infer<typeof bossDefSchema>;
export type BossCategory = z.infer<typeof bossCategorySchema>;
export type BossMechanicKind = z.infer<typeof bossMechanicKindSchema>;
export type BossMechanic = z.infer<typeof bossMechanicSchema>;
export type BossLair = z.infer<typeof bossLairSchema>;
export type BossSafeRating = z.infer<typeof bossSafeRatingSchema>;

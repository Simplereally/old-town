/** Activity definitions for repeatable gameplay loops. */
import { z } from "zod";
import { contentIdSchema, nonNegInt, positiveInt } from "./common";

export const activityCategorySchema = z.enum([
  "skilling",
  "production",
  "skillingBoss",
  "course",
  "publicWork",
  "combatLite",
  "risk",
  "puzzle",
]);

export type ActivityCategory = z.infer<typeof activityCategorySchema>;

export const activityRiskSchema = z.enum(["safe", "risky", "dangerous"]);

export type ActivityRisk = z.infer<typeof activityRiskSchema>;

export const activityRewardSchema = z.object({
  type: z.enum(["xp", "item", "token", "cosmetic"]),
  skillId: contentIdSchema.optional(),
  itemId: contentIdSchema.optional(),
  tokenId: contentIdSchema.optional(),
  cosmeticId: contentIdSchema.optional(),
  quantity: nonNegInt.default(1),
});

export type ActivityReward = z.infer<typeof activityRewardSchema>;

export const activityStepSchema = z.object({
  id: contentIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  skillId: contentIdSchema.optional(),
  requiredLevel: nonNegInt.default(1),
  actionTicks: positiveInt.default(1),
  inputs: z
    .array(z.object({ itemId: contentIdSchema, quantity: nonNegInt.default(1) }))
    .default([]),
  outputs: z
    .array(z.object({ itemId: contentIdSchema, quantity: nonNegInt.default(1) }))
    .default([]),
  xpReward: z
    .array(z.object({ skillId: contentIdSchema, amount: nonNegInt.default(1) }))
    .default([]),
  failureChance: z.number().min(0).max(1).default(0),
});

export type ActivityStep = z.infer<typeof activityStepSchema>;

export const activityDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    category: activityCategorySchema,
    risk: activityRiskSchema,
    skills: z.array(contentIdSchema).min(1),
    entryRequirement: z.object({
      skillId: contentIdSchema,
      level: nonNegInt.default(1),
    }),
    location: z.object({
      description: z.string().min(1),
      regionId: contentIdSchema.optional(),
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      plane: z.number().int().min(0).max(3).optional(),
    }),
    steps: z.array(activityStepSchema).min(1),
    rewards: z.array(activityRewardSchema).default([]),
    tokenId: contentIdSchema.optional(),
    tokenSink: z
      .array(z.object({ itemId: contentIdSchema, quantity: nonNegInt.default(1) }))
      .default([]),
    loopDescription: z.string().min(1),
    failureState: z.string().min(1),
    inputs: z
      .array(z.object({ itemId: contentIdSchema, quantity: nonNegInt.default(1) }))
      .default([]),
    outputs: z
      .array(z.object({ itemId: contentIdSchema, quantity: nonNegInt.default(1) }))
      .default([]),
  })
  .strict();

export type ActivityDef = z.infer<typeof activityDefSchema>;

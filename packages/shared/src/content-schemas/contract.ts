/** Wardenry contract definitions for bounty and extermination quests. */
import { z } from "zod";
import { contentIdSchema, itemQuantitySchema, nonNegInt, positiveInt } from "./common";

export const contractTypeSchema = z.enum(["bounty", "extermination", "collection", "escort"]);

export const contractDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    contractType: contractTypeSchema,
    targetCreatureIds: z.array(contentIdSchema).default([]),
    targetCount: positiveInt.default(1),
    rewardItems: z.array(itemQuantitySchema).default([]),
    rewardXp: z
      .array(z.object({ skillId: contentIdSchema, amount: positiveInt }).strict())
      .default([]),
    rewardReputation: z
      .object({
        factionId: contentIdSchema,
        amount: nonNegInt,
      })
      .strict()
      .optional(),
    requiredLevel: positiveInt.default(1),
    requiredQuest: contentIdSchema.optional(),
    timeLimitTicks: positiveInt.optional(),
    maxConcurrent: positiveInt.default(1),
    completionTrigger: z.enum(["kill", "collect", "deliver"]).default("kill"),
  })
  .strict();

export type ContractDef = z.infer<typeof contractDefSchema>;
export type ContractType = z.infer<typeof contractTypeSchema>;

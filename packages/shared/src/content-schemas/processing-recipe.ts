/** Processing recipe definitions (POC_SPEC §15, §28.4). */
import { z } from "zod";
import { contentIdSchema, positiveInt } from "./common";

export const processingRecipeDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    skill: contentIdSchema,
    requiredLevel: positiveInt,
    actionTicks: positiveInt,
    stationObjectIds: z.array(contentIdSchema).min(1),
    inputItemId: contentIdSchema,
    inputQuantity: positiveInt.default(1),
    successItemId: contentIdSchema,
    successQuantity: positiveInt.default(1),
    failureItemId: contentIdSchema.optional(),
    failureQuantity: positiveInt.default(1),
    xp: z.number().nonnegative(),
    failureChance: z.number().min(0).max(1).default(0),
  })
  .strict();

export type ProcessingRecipeDef = z.infer<typeof processingRecipeDefSchema>;

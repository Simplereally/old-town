/** Charter definitions for permits that gate access to areas, activities, or content. */
import { z } from "zod";
import { contentIdSchema, nonNegInt, itemQuantitySchema } from "./common";

export const charterTypeSchema = z.enum(["area", "activity", "content"]);

export const charterDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    type: charterTypeSchema,
    requiredStanding: nonNegInt.default(0),
    cost: itemQuantitySchema.optional(),
    duration: nonNegInt.default(0),
  })
  .strict();

export type CharterDef = z.infer<typeof charterDefSchema>;
export type CharterType = z.infer<typeof charterTypeSchema>;

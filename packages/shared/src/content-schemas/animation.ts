/** Animation clip definitions (referenced by skilling/combat actions). */
import { z } from "zod";
import { contentIdSchema, positiveInt } from "./common";

export const animationDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    /** Duration in ticks (presentational hint only). */
    durationTicks: positiveInt.optional(),
    /** Underlying animation asset reference. */
    asset: contentIdSchema.optional(),
  })
  .strict();

export type AnimationDef = z.infer<typeof animationDefSchema>;

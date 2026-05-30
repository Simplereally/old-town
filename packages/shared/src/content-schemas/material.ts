/** Ground material definitions (referenced by region tiles as underlay/overlay). */
import { z } from "zod";
import { contentIdSchema } from "./common";

export const materialDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    /** Flat color as 0xRRGGBB, used when no texture asset is present. */
    color: z.number().int().min(0).max(0xffffff).optional(),
    texture: contentIdSchema.optional(),
  })
  .strict();

export type MaterialDef = z.infer<typeof materialDefSchema>;

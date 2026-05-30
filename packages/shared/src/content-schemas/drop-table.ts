/** Drop table definitions (POC_SPEC §21.1). */
import { z } from "zod";
import { contentIdSchema, itemQuantitySchema, positiveInt, requirementSchema } from "./common";

/** A single weighted drop entry. */
export const dropEntrySchema = z
  .object({
    itemId: contentIdSchema,
    min: positiveInt,
    max: positiveInt,
    /** Relative weight within the table's weighted roll. */
    weight: positiveInt,
    requirements: z.array(requirementSchema).default([]),
  })
  .strict()
  .refine((e) => e.max >= e.min, { message: "drop entry max must be >= min" });

export const dropTableDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1).optional(),
    /** Number of weighted rolls per kill (default 1). */
    rolls: positiveInt.default(1),
    /** Items always dropped regardless of rolls. */
    alwaysDrops: z.array(itemQuantitySchema).default([]),
    /** Weighted entries; one is chosen per roll. An empty pool means no random drop. */
    entries: z.array(dropEntrySchema).default([]),
  })
  .strict();

export type DropEntry = z.infer<typeof dropEntrySchema>;
export type DropTableDef = z.infer<typeof dropTableDefSchema>;

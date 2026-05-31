/** Bank definitions for storage locations and capacity. */
import { z } from "zod";
import { contentIdSchema, nonNegInt } from "./common";

/** A bank definition with location, capacity, and fee settings. */
export const bankDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    location: z
      .object({
        plane: nonNegInt.default(0),
        tileX: nonNegInt,
        tileY: nonNegInt,
      })
      .strict(),
    capacity: nonNegInt.default(400),
    tabs: z.boolean().default(true),
    feePerItem: nonNegInt.default(0),
  })
  .strict();

export type BankDef = z.infer<typeof bankDefSchema>;

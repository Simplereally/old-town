/** Property definitions for ledger deed ownership. */
import { z } from "zod";
import { contentIdSchema, nonNegInt } from "./common";

export const propertyDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    location: z
      .object({
        plane: nonNegInt.default(0),
        tileX: nonNegInt,
        tileY: nonNegInt,
      })
      .strict()
      .optional(),
    maxOwners: nonNegInt.default(1),
    transferable: z.boolean().default(true),
    expiryTicks: nonNegInt.default(0),
  })
  .strict();

export type PropertyDef = z.infer<typeof propertyDefSchema>;

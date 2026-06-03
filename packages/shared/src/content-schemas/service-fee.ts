/** Service fee definitions for vendor pricing and repair costs. */
import { z } from "zod";
import { contentIdSchema, itemQuantitySchema, nonNegInt } from "./common";

export const serviceTypeSchema = z.enum([
  "repair",
  "teleport",
  "identify",
  "enchant",
  "craft",
  "tanning",
  "smelting",
  "bead_firing",
  "blessing",
  "reclaim",
  "contract_reroll",
  "ferry",
  "map_copy",
  "cleanse",
]);

export type ServiceType = z.infer<typeof serviceTypeSchema>;

/** A service fee definition with base cost, scaling, and material requirements. */
export const serviceFeeDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    serviceType: serviceTypeSchema,
    baseFee: nonNegInt.default(0),
    levelMultiplier: z.number().min(0).default(1.0),
    materialCost: z.array(itemQuantitySchema).default([]),
    currency: contentIdSchema.default("coin"),
    requiresQuest: contentIdSchema.optional(),
    destination: z
      .object({
        x: z.number().int(),
        y: z.number().int(),
        plane: z.number().int(),
      })
      .strict()
      .optional(),
    outputItemId: contentIdSchema.optional(),
    outputQuantity: nonNegInt.default(1),
    skillId: contentIdSchema.optional(),
  })
  .strict();

export type ServiceFeeDef = z.infer<typeof serviceFeeDefSchema>;

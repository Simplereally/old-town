/** Service fee definitions for vendor pricing and repair costs. */
import { z } from "zod";
import { contentIdSchema, itemQuantitySchema, nonNegInt } from "./common";

export const serviceTypeSchema = z.enum(["repair", "teleport", "identify", "enchant", "craft"]);

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
  })
  .strict();

export type ServiceFeeDef = z.infer<typeof serviceFeeDefSchema>;

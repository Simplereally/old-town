/** Shop definitions for merchant stock and pricing. */
import { z } from "zod";
import { contentIdSchema, nonNegInt, positiveInt } from "./common";

/** A single item stocked by a shop. */
export const shopStockSchema = z
  .object({
    itemId: contentIdSchema,
    quantity: nonNegInt.default(1),
    maxQuantity: nonNegInt.default(1),
    price: positiveInt.optional(),
    restockRate: nonNegInt.default(1),
  })
  .strict();

export type ShopStock = z.infer<typeof shopStockSchema>;

/** A shop definition with stock, pricing, and restock behaviour. */
export const shopDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    stock: z.array(shopStockSchema).default([]),
    currency: contentIdSchema.default("coin"),
    sellMultiplier: z.number().min(0).default(0.6),
    buyMultiplier: z.number().min(0).default(1.0),
    restockTicks: positiveInt.default(100),
    buyPolicy: z
      .enum(["always", "quest_gated", "skill_gated", "reputation_gated", "rotating", "never"])
      .default("always"),
    sellPolicy: z
      .enum([
        "buys_category",
        "buys_exact_list",
        "buys_junk",
        "refuses_stolen",
        "fences_stolen",
        "does_not_buy",
      ])
      .default("does_not_buy"),
    unlockCondition: z.string().optional(),
  })
  .strict();

export type ShopDef = z.infer<typeof shopDefSchema>;

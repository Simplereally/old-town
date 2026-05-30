/** Spell definitions (POC_SPEC §17.1). */
import { z } from "zod";
import { tileCoordSchema } from "../protocol/schema-primitives";
import { contentIdSchema, itemQuantitySchema, nonNegInt, positiveInt } from "./common";

/**
 * A spell's gameplay effect. Modeled as a typed, validatable descriptor rather than an
 * opaque script id (preserves the content-driven invariant; POC_SPEC §17.2, §28.4).
 */
export const spellEffectSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("damage"),
      maxHit: positiveInt,
      /** Ticks between cast and damage application (projectile travel). */
      hitDelayTicks: nonNegInt.default(2),
      projectileId: contentIdSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("teleport"),
      /** Fixed destination; omit for "home" style returns resolved by the server. */
      destination: tileCoordSchema.optional(),
      delayTicks: nonNegInt,
      interruptible: z.boolean().default(true),
    })
    .strict(),
  z
    .object({ kind: z.literal("bind"), durationTicks: positiveInt, maxHit: nonNegInt.default(0) })
    .strict(),
  z
    .object({ kind: z.literal("enchant"), fromItemId: contentIdSchema, toItemId: contentIdSchema })
    .strict(),
  z
    .object({
      kind: z.literal("alchemy"),
      coinItemId: contentIdSchema,
      valueMultiplier: z.number().positive(),
    })
    .strict(),
]);

export type SpellEffect = z.infer<typeof spellEffectSchema>;

export const spellDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    spellbook: z.enum(["common", "old_ways", "wild", "ritual"]),
    requiredMagic: positiveInt,
    beadCosts: z.array(itemQuantitySchema).default([]),
    castXp: z.number().nonnegative(),
    rangeTiles: nonNegInt,
    targetType: z.enum(["self", "entity", "tile", "item"]),
    requiresLineOfSight: z.boolean().default(false),
    cooldownTicks: nonNegInt.optional(),
    effect: spellEffectSchema,
  })
  .strict();

export type SpellDef = z.infer<typeof spellDefSchema>;

/** Status effect definitions for buffs, debuffs, and conditions. */
import { z } from "zod";
import { contentIdSchema, nonNegInt, positiveInt } from "./common";

export const statusEffectTypeSchema = z.enum(["buff", "debuff", "dot", "hot", "cc"]);

export const statModifierSchema = z
  .object({
    stat: z.string().min(1),
    value: z.number().int(),
    mode: z.enum(["add", "multiply", "set"]).default("add"),
  })
  .strict();

export const statusEffectDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    icon: contentIdSchema.optional(),
    durationTicks: nonNegInt.default(10),
    maxStacks: positiveInt.default(1),
    effectType: statusEffectTypeSchema,
    statModifiers: z.array(statModifierSchema).default([]),
    cureItems: z.array(contentIdSchema).default([]),
  })
  .strict();

export type StatusEffectDef = z.infer<typeof statusEffectDefSchema>;
export type StatModifier = z.infer<typeof statModifierSchema>;
export type StatusEffectType = z.infer<typeof statusEffectTypeSchema>;

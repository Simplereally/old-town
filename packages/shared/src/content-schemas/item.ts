/** Item, equipment, and consumable definitions (POC_SPEC §16, §13.2). */
import { z } from "zod";
import {
  combatBonusesSchema,
  combatStyleSchema,
  contentIdSchema,
  equipmentSlotSchema,
  nonNegInt,
  positiveInt,
  skillRequirementSchema,
  weaponCategorySchema,
} from "./common";

/** Equipment data attached to a wearable/wieldable item (POC_SPEC §16.1, §13.2). */
export const equipmentDefSchema = z
  .object({
    slot: equipmentSlotSchema,
    bonuses: combatBonusesSchema.default({}),
    requirements: z.array(skillRequirementSchema).default([]),
    // Weapon-only fields:
    weaponCategory: weaponCategorySchema.optional(),
    attackSpeedTicks: positiveInt.optional(),
    attackRangeTiles: nonNegInt.optional(),
    allowedStyles: z.array(combatStyleSchema).optional(),
  })
  .strict();

export type EquipmentDef = z.infer<typeof equipmentDefSchema>;

/** Consumable data attached to a food/potion item (POC_SPEC §16.1). */
export const consumableDefSchema = z
  .object({
    /** Hitpoints restored when consumed. */
    heal: nonNegInt,
    /** Ticks the eat/drink action occupies (default 1). */
    consumeTicks: positiveInt.default(1),
  })
  .strict();

export type ConsumableDef = z.infer<typeof consumableDefSchema>;

/** A complete item definition (POC_SPEC §16.1). */
export const itemDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    stackable: z.boolean(),
    tradeable: z.boolean(),
    examine: z.string().min(1),
    icon: contentIdSchema,
    model: contentIdSchema.optional(),
    value: nonNegInt,
    weight: z.number().optional(),
    /** Inventory interaction verbs, e.g. ["wield"], ["eat", "drop"]. */
    options: z.array(z.string().min(1)).default([]),
    /** Tool tags for skilling (e.g. ["axe"], ["pickaxe"]). */
    tags: z.array(z.string().min(1)).default([]),
    equipment: equipmentDefSchema.optional(),
    consumable: consumableDefSchema.optional(),
  })
  .strict();

export type ItemDef = z.infer<typeof itemDefSchema>;

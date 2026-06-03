/** Persistent character snapshot contract (POC_SPEC §20, §25).
 *
 * This is deliberately storage-neutral: JSON dev files and future PostgreSQL rows must both map
 * through this shape before touching live ECS state.
 */
import { z } from "zod";
import { EQUIPMENT_SLOTS } from "../constants";
import { contentIdSchema, nonNegInt, playerVarValueSchema, positiveInt } from "../content-schemas";
import { tileCoordSchema } from "../protocol/schema-primitives";

export const CHARACTER_SNAPSHOT_VERSION = 1;

export const characterSkillSnapshotSchema = z
  .object({
    level: positiveInt,
    xp: nonNegInt,
    boost: z.number().int().default(0),
    drain: z.number().int().default(0),
  })
  .strict();

export const characterInventorySlotSnapshotSchema = z
  .object({
    slot: nonNegInt,
    itemId: contentIdSchema,
    quantity: positiveInt,
    uid: positiveInt,
  })
  .strict();

export const characterInventorySnapshotSchema = z
  .object({
    containerId: z.string().min(1),
    capacity: positiveInt,
    nextUid: positiveInt,
    slots: z.array(characterInventorySlotSnapshotSchema).default([]),
  })
  .strict()
  .superRefine((inventory, ctx) => {
    const seenSlots = new Set<number>();
    const seenUids = new Set<number>();
    let maxUid = 0;
    for (const item of inventory.slots) {
      if (item.slot >= inventory.capacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", item.slot],
          message: `slot ${item.slot} is outside capacity ${inventory.capacity}`,
        });
      }
      if (seenSlots.has(item.slot)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", item.slot],
          message: `duplicate inventory slot ${item.slot}`,
        });
      }
      if (seenUids.has(item.uid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", item.slot, "uid"],
          message: `duplicate inventory uid ${item.uid}`,
        });
      }
      seenSlots.add(item.slot);
      seenUids.add(item.uid);
      maxUid = Math.max(maxUid, item.uid);
    }
    if (inventory.nextUid <= maxUid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextUid"],
        message: `nextUid ${inventory.nextUid} must be greater than highest uid ${maxUid}`,
      });
    }
  });

export const characterEquipmentSnapshotSchema = z
  .object({
    slots: z.record(z.enum(EQUIPMENT_SLOTS), contentIdSchema).default({}),
  })
  .strict();

export const characterHitpointsSnapshotSchema = z
  .object({
    health: nonNegInt,
    maxHealth: positiveInt,
  })
  .strict()
  .refine((hitpoints) => hitpoints.health <= hitpoints.maxHealth, {
    message: "health cannot exceed maxHealth",
    path: ["health"],
  });

export const characterBankSnapshotSchema = z
  .object({
    capacity: positiveInt.default(400),
    nextUid: positiveInt.default(1),
    slots: z.array(characterInventorySlotSnapshotSchema).default([]),
  })
  .strict();

export const characterSnapshotSchema = z
  .object({
    version: z.literal(CHARACTER_SNAPSHOT_VERSION),
    characterId: z.string().min(1).max(128),
    savedAt: nonNegInt,
    position: tileCoordSchema,
    hitpoints: characterHitpointsSnapshotSchema,
    skills: z.record(contentIdSchema, characterSkillSnapshotSchema).default({}),
    inventory: characterInventorySnapshotSchema,
    equipment: characterEquipmentSnapshotSchema,
    vars: z.record(z.string().min(1), playerVarValueSchema).default({}),
    bank: characterBankSnapshotSchema.default({ slots: [] }),
  })
  .strict();

export type CharacterSkillSnapshot = z.infer<typeof characterSkillSnapshotSchema>;
export type CharacterInventorySlotSnapshot = z.infer<typeof characterInventorySlotSnapshotSchema>;
export type CharacterInventorySnapshot = z.infer<typeof characterInventorySnapshotSchema>;
export type CharacterEquipmentSnapshot = z.infer<typeof characterEquipmentSnapshotSchema>;
export type CharacterHitpointsSnapshot = z.infer<typeof characterHitpointsSnapshotSchema>;
export type CharacterBankSnapshot = z.infer<typeof characterBankSnapshotSchema>;
export type CharacterSnapshot = z.infer<typeof characterSnapshotSchema>;

export function parseCharacterSnapshot(value: unknown): CharacterSnapshot {
  return characterSnapshotSchema.parse(value);
}

export function isCharacterSnapshot(value: unknown): value is CharacterSnapshot {
  return characterSnapshotSchema.safeParse(value).success;
}

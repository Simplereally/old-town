/** NPC definitions (POC_SPEC §14.1). */
import { z } from "zod";
import { actionIdSchema } from "../content/action-id";
import {
  combatBonusesSchema,
  combatStatsSchema,
  contentIdSchema,
  nonNegInt,
  positiveInt,
} from "./common";

/** A clickable interaction option on an NPC/object (POC_SPEC §12). */
export const interactionOptionDefSchema = z
  .object({
    label: z.string().min(1),
    /** Engine action verb resolved from content (e.g. "attack", "talk"). */
    actionId: actionIdSchema,
    priority: nonNegInt.default(0),
    requiredDistance: nonNegInt.default(1),
    requiresLineOfSight: z.boolean().optional(),
    faceTarget: z.boolean().optional(),
  })
  .strict();

export type InteractionOptionDef = z.infer<typeof interactionOptionDefSchema>;

export const movementTypeSchema = z.enum(["static", "wander", "patrol", "chase"]);
export const aggressionModeSchema = z.enum(["peaceful", "aggressive", "retaliate"]);
export const creatureKindSchema = z.enum(["passive", "aggressive", "retaliating", "fleeing"]);

export const weaknessSchema = z
  .object({
    element: z.enum(["fire", "water", "earth", "air", "none"]).default("none"),
    multiplier: z.number().min(0).default(1.0),
  })
  .strict();

export const npcDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    examine: z.string().min(1).optional(),
    /** Footprint size in tiles (1..4). */
    size: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    combatLevel: nonNegInt.optional(),
    maxHp: positiveInt.optional(),
    stats: combatStatsSchema.optional(),
    bonuses: combatBonusesSchema.optional(),
    attackSpeedTicks: positiveInt.optional(),
    attackRangeTiles: nonNegInt.optional(),
    aggressiveRadius: nonNegInt.optional(),
    wanderRadius: nonNegInt.default(0),
    respawnTicks: positiveInt,
    /** Drop table id rolled on death. */
    drops: contentIdSchema.optional(),
    /** Dialogue graph opened by a "talk" option. */
    dialogueId: contentIdSchema.optional(),
    options: z.array(interactionOptionDefSchema).default([]),
    /** Creature movement and aggression fields (E18-S01). */
    movementType: movementTypeSchema.default("static"),
    aggressionMode: aggressionModeSchema.default("peaceful"),
    creatureKind: creatureKindSchema.optional(),
    weakness: weaknessSchema.optional(),
    trophyId: contentIdSchema.optional(),
    contractEligible: z.boolean().default(false),
  })
  .strict();

export type NpcDef = z.infer<typeof npcDefSchema>;

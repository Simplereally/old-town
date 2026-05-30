/** World object definitions (POC_SPEC §5.3, §12). */
import { z } from "zod";
import { contentIdSchema, nonNegInt, positiveInt } from "./common";
import { interactionOptionDefSchema } from "./npc";

export const objectDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    examine: z.string().min(1).optional(),
    /** Footprint width/length in tiles. */
    width: positiveInt.default(1),
    length: positiveInt.default(1),
    /** Whether the object blocks movement on its tiles. */
    blocksMovement: z.boolean().default(true),
    /** Whether the object blocks line of sight / projectiles. */
    blocksLineOfSight: z.boolean().default(false),
    /** Resource node id, when this object is a gatherable (tree/rock). */
    resourceNodeId: contentIdSchema.optional(),
    /** Dialogue graph opened by interaction, if any. */
    dialogueId: contentIdSchema.optional(),
    options: z.array(interactionOptionDefSchema).default([]),
    /** Optional model asset reference. */
    model: contentIdSchema.optional(),
    /** Rotation in 0..3 quarter-turns. */
    defaultRotation: nonNegInt.max(3).default(0),
  })
  .strict();

export type ObjectDef = z.infer<typeof objectDefSchema>;

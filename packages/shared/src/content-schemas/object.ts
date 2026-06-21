/** World object definitions (POC_SPEC §5.3, §12). */
import { z } from "zod";
import { tileCoordSchema } from "../protocol/schema-primitives";
import { contentIdSchema, nonNegInt, positiveInt } from "./common";
import { interactionOptionDefSchema } from "./npc";

export const footprintOffsetSchema = z
  .object({ dx: nonNegInt, dy: nonNegInt })
  .strict();

export const roofCoverageSchema = z
  .object({ width: positiveInt, length: positiveInt })
  .strict();

export const objectDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    examine: z.string().min(1).optional(),
    /** Footprint width/length in tiles. */
    width: positiveInt.default(1),
    length: positiveInt.default(1),
    /** Explicit tile offsets for non-rectangular footprints. Defaults to width×length rectangle. */
    footprint: z.array(footprintOffsetSchema).optional(),
    /** Whether the object blocks movement on its tiles. */
    blocksMovement: z.boolean().default(true),
    /** Whether the object blocks line of sight / projectiles. */
    blocksLineOfSight: z.boolean().default(false),
    /** Explicit collision bitmask override. If absent, derived from blocksMovement/blocksLineOfSight. */
    defaultCollision: nonNegInt.optional(),
    /** Marks this object as a door for the door interaction system. */
    isDoor: z.boolean().optional(),
    /** Marks this object as a gate (multi-tile door) for the door interaction system. */
    isGate: z.boolean().optional(),
    /** Roof coverage area for roof objects. Defines the interior footprint that hides the roof. */
    roofCoverage: roofCoverageSchema.optional(),
    /** Resource node id, when this object is a gatherable (tree/rock). */
    resourceNodeId: contentIdSchema.optional(),
    /** Dialogue graph opened by interaction, if any. */
    dialogueId: contentIdSchema.optional(),
    /** Plain text shown when the object is read. */
    text: z.string().optional(),
    /** Destination tile for enter actions (e.g. doors, ladders). */
    transitionDestination: tileCoordSchema.optional(),
    /** Nook entrance id, when this object is a hidden or gated area entrance. */
    nookId: z.string().optional(),
    options: z.array(interactionOptionDefSchema).default([]),
    /** Optional model asset reference. */
    model: contentIdSchema.optional(),
    /** Rotation in 0..3 quarter-turns. */
    defaultRotation: nonNegInt.max(3).default(0),
    /** Drop table id for chest contents, rolled when opened. */
    dropTableId: contentIdSchema.optional(),
    /** Activity id triggered by interacting with this object. */
    activityId: contentIdSchema.optional(),
  })
  .strict();

export type ObjectDef = z.infer<typeof objectDefSchema>;

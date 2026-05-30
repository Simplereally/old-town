/**
 * Region map definitions (POC_SPEC §24.2). A region is 64×64 tiles. Tile data is stored
 * sparsely — a default tile plus per-tile overrides — so maps are compact, diff-friendly,
 * and editor-authored (E14). Local coordinates are 0..63 within the region.
 */
import { z } from "zod";
import { REGION_SIZE } from "../constants";
import { planeSchema } from "../protocol/schema-primitives";
import { contentIdSchema, nonNegInt } from "./common";

const localAxis = z
  .number()
  .int()
  .min(0)
  .max(REGION_SIZE - 1);

/** Region coordinate of the map. */
export const regionCoordSchema = z
  .object({ rx: z.number().int(), ry: z.number().int(), plane: planeSchema })
  .strict();

/** Default tile applied across the whole region unless overridden. */
export const defaultTileSchema = z
  .object({
    height: z.number().int().default(0),
    underlayId: contentIdSchema,
    collision: nonNegInt.default(0),
  })
  .strict();

/** A per-tile override (only changed fields need be present). */
export const tileOverrideSchema = z
  .object({
    x: localAxis,
    y: localAxis,
    height: z.number().int().optional(),
    underlayId: contentIdSchema.optional(),
    overlayId: contentIdSchema.optional(),
    collision: nonNegInt.optional(),
    water: z.boolean().optional(),
    bridge: z.boolean().optional(),
  })
  .strict();

/** An object placed in the region. */
export const placedObjectSchema = z
  .object({
    objectId: contentIdSchema,
    x: localAxis,
    y: localAxis,
    rotation: nonNegInt.max(3).default(0),
  })
  .strict();

/** An NPC spawn point. */
export const npcSpawnSchema = z
  .object({
    npcId: contentIdSchema,
    x: localAxis,
    y: localAxis,
    wanderRadius: nonNegInt.optional(),
  })
  .strict();

/** A ground item spawn. */
export const groundItemSpawnSchema = z
  .object({
    itemId: contentIdSchema,
    quantity: z.number().int().positive().default(1),
    x: localAxis,
    y: localAxis,
  })
  .strict();

/** A named area trigger (quest hooks, zone markers). */
export const areaTriggerSchema = z
  .object({
    id: z.string().min(1),
    x: localAxis,
    y: localAxis,
    width: z.number().int().positive().default(1),
    height: z.number().int().positive().default(1),
    tag: z.string().min(1).optional(),
  })
  .strict();

export const regionMapDefSchema = z
  .object({
    region: regionCoordSchema,
    /** Sparse tile data. */
    tiles: z
      .object({
        default: defaultTileSchema,
        overrides: z.array(tileOverrideSchema).default([]),
      })
      .strict(),
    objects: z.array(placedObjectSchema).default([]),
    npcSpawns: z.array(npcSpawnSchema).default([]),
    groundItemSpawns: z.array(groundItemSpawnSchema).default([]),
    triggers: z.array(areaTriggerSchema).default([]),
  })
  .strict();

export type RegionMapDef = z.infer<typeof regionMapDefSchema>;
export type PlacedObjectDef = z.infer<typeof placedObjectSchema>;
export type NpcSpawnDef = z.infer<typeof npcSpawnSchema>;
export type GroundItemSpawnDef = z.infer<typeof groundItemSpawnSchema>;
export type AreaTriggerDef = z.infer<typeof areaTriggerSchema>;
export type TileOverride = z.infer<typeof tileOverrideSchema>;
export type DefaultTile = z.infer<typeof defaultTileSchema>;

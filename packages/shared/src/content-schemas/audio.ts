/**
 * Audio content definitions (E47-S00).
 *
 * One registry kind covers ambience loops, positional world sources, UI one-shots,
 * and server-driven action cues. Definitions reference relative asset paths under
 * `assets/audio/` — bytes are never embedded in content JSON (POC_SPEC §23.1).
 */
import { z } from "zod";
import { contentIdSchema, nonNegInt, positiveInt } from "./common";

/** Playback category for an audio definition. */
export const audioCategorySchema = z.enum(["ambience", "positional", "ui", "action"]);

export type AudioCategory = z.infer<typeof audioCategorySchema>;

/**
 * Relative asset path under the repo `assets/` tree.
 * Accepts OGG/WebM (and WAV for generated placeholders) as referenced by §23.1.
 */
export const audioAssetPathSchema = z
  .string()
  .min(1)
  .regex(
    /^assets\/audio\/[a-z0-9][a-z0-9_./-]*\.(ogg|webm|wav)$/,
    "must be assets/audio/... with .ogg, .webm, or .wav extension",
  );

/** Optional tile anchor for positional sources (integer world coords). */
export const audioTileSchema = z
  .object({
    x: z.number().int(),
    y: z.number().int(),
    plane: nonNegInt.default(0),
  })
  .strict();

export type AudioTile = z.infer<typeof audioTileSchema>;

/**
 * A single audio definition.
 *
 * - `ambience`: looping district/zone bed; `zoneIds` maps which zones play it.
 * - `positional`: static world source with distance falloff from `tile`.
 * - `ui`: client-local UI one-shots (click, menu, error, …).
 * - `action`: server `SoundPacket` cue IDs (`door_open`, `bell_ring`, …).
 */
export const audioDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    category: audioCategorySchema,
    /** Path relative to repo root, e.g. `assets/audio/ui/click.ogg`. */
    assetPath: audioAssetPathSchema,
    /** Base gain 0..1 before category/master volume. */
    volume: z.number().min(0).max(1).default(1),
    /** Whether the clip loops (ambience/positional typically true). */
    loop: z.boolean().default(false),
    /** Cross-fade / ramp duration in milliseconds when starting or stopping. */
    fadeMs: nonNegInt.default(0),
    /**
     * Zone/district IDs that should play this ambience (category `ambience` only).
     * Empty/omitted means the def is a named fallback bed, not auto-bound to a zone.
     */
    zoneIds: z.array(z.string().min(1)).default([]),
    /** When true, this ambience is the silent/default fallback for unmapped zones. */
    fallback: z.boolean().default(false),
    /** World tile for positional sources. */
    tile: audioTileSchema.optional(),
    /** Max audible distance in tiles for positional sources. */
    maxDistanceTiles: positiveInt.optional(),
    /** Linear falloff start distance in tiles (gain = 1 inside this radius). */
    falloffStartTiles: nonNegInt.optional(),
  })
  .strict()
  .superRefine((def, ctx) => {
    if (def.category === "positional") {
      if (!def.tile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tile"],
          message: "positional audio requires tile",
        });
      }
      if (def.maxDistanceTiles === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxDistanceTiles"],
          message: "positional audio requires maxDistanceTiles",
        });
      }
    }
    if (def.category === "ambience" && def.fallback && def.zoneIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zoneIds"],
        message: "fallback ambience must not list zoneIds",
      });
    }
  });

export type AudioDef = z.infer<typeof audioDefSchema>;

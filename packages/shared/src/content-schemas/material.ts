/** Ground material definitions (referenced by region tiles as underlay/overlay). */
import { z } from "zod";
import { contentIdSchema } from "./common";

/** Visual / functional category of a ground material. */
export const materialCategorySchema = z.enum([
  "plaza",
  "road",
  "floor",
  "water",
  "soil",
  "grass",
  "stone",
  "wood",
  "metal",
  "organic",
  "transition",
  "misc",
]);

export type MaterialCategory = z.infer<typeof materialCategorySchema>;

/** Simple noise parameters for vertex-color variation (no external textures in POC). */
export const textureNoiseSchema = z
  .object({
    scale: z.number().positive().default(1),
    amplitude: z.number().min(0).max(1).default(0.1),
  })
  .strict();

export type TextureNoise = z.infer<typeof textureNoiseSchema>;

export const materialDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    /** Flat base color as 0xRRGGBB, used when no texture asset is present. */
    color: z.number().int().min(0).max(0xffffff).optional(),
    /** Secondary accent color for detail/overlay blending. */
    accentColor: z.number().int().min(0).max(0xffffff).optional(),
    /** Optional noise parameters for per-tile vertex color variation. */
    textureNoise: textureNoiseSchema.optional(),
    /** Whether this material is a water surface (rendered translucent, below ground). */
    isWater: z.boolean().default(false),
    /** Whether this material is a bridge surface (renders above water, suppresses water collision). */
    isBridge: z.boolean().default(false),
    /** Material roughness 0..1 (affects toon/lambert lighting response). */
    roughness: z.number().min(0).max(1).default(0.8),
    /** Visual / functional category for grouping and validation. */
    category: materialCategorySchema.default("misc"),
    /** Optional texture asset reference (POC uses flat colors; textures can be added later). */
    texture: contentIdSchema.optional(),
  })
  .strict();

export type MaterialDef = z.infer<typeof materialDefSchema>;

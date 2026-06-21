/**
 * Asset manifest schema (E41-S01).
 *
 * Every item `icon`/`model` AssetId referenced by `content/items/*.json` must
 * resolve to an entry in `assets/items/manifest.json`. The build pipeline
 * (`items:build-assets`) composes silhouettes + tier palettes into a deterministic
 * sprite atlas and fills `atlas`/`atlasCell` on each icon entry. The validator
 * (`items:validate-assets`) fails the build on any dangling reference.
 */
import { z } from "zod";
import { contentIdSchema } from "./common";

/** The three asset kinds produced by the item pipeline. */
export const assetKindSchema = z.enum(["icon", "model", "billboard"]);

/** A packed cell within a sprite atlas (top-left origin, integer pixels). */
export const atlasCellSchema = z
  .object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
  })
  .strict();

/**
 * A single asset manifest entry.
 *
 * - `source` is the authored source path relative to `assets/items/`:
 *   for icons, the silhouette SVG; for models, the model spec JSON.
 * - `silhouette`/`palette` are icon-composition inputs (silhouette SVG path +
 *   tier-palette JSON path, both relative to `assets/items/`).
 * - `paletteRegions` is the resolved region→hex-colour map used to recolour the
 *   silhouette. Authored for hand-tuned entries; otherwise derived from the
 *   palette file at build time.
 * - `atlas`/`atlasCell` are filled by the build script after packing.
 */
export const assetManifestEntrySchema = z
  .object({
    id: contentIdSchema,
    kind: assetKindSchema,
    source: z.string().min(1),
    silhouette: z.string().min(1).optional(),
    palette: z.string().min(1).optional(),
    atlas: z.string().min(1).optional(),
    atlasCell: atlasCellSchema.optional(),
    paletteRegions: z.record(z.string(), z.string()).optional(),
  })
  .strict();

/** The top-level asset manifest (`assets/items/manifest.json`). */
export const assetManifestSchema = z
  .object({
    version: z.literal(1),
    assets: z.array(assetManifestEntrySchema),
  })
  .strict();

/** The five tier-ladder palette sets (E41 approach, `docs/items/00-index.md`). */
export const tierLadderSchema = z.enum(["melee", "ranged", "magic", "ranged-armour", "accessory"]);

/** A tier-palette file (`assets/items/palettes/<ladder>/<tier>.json`). */
export const tierPaletteSchema = z
  .object({
    ladder: tierLadderSchema,
    tier: contentIdSchema,
    tierOrder: z.number().int().min(0).max(12),
    regions: z.record(z.string(), z.string()),
  })
  .strict();

/** A packed atlas index (`assets/items/atlases/atlas-index.json`). */
export const atlasIndexSchema = z
  .object({
    version: z.literal(1),
    atlas: z.string().min(1),
    cellSize: z.number().int().positive(),
    cells: z.record(z.string(), atlasCellSchema),
  })
  .strict();

export type AssetKind = z.infer<typeof assetKindSchema>;
export type AtlasCell = z.infer<typeof atlasCellSchema>;
export type AssetManifestEntry = z.infer<typeof assetManifestEntrySchema>;
export type AssetManifest = z.infer<typeof assetManifestSchema>;
export type TierLadder = z.infer<typeof tierLadderSchema>;
export type TierPalette = z.infer<typeof tierPaletteSchema>;
export type AtlasIndex = z.infer<typeof atlasIndexSchema>;

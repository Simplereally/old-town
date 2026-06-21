import type { MaterialDef } from "@old-town/shared";

/** Default fallback color (matches starter "grass" base) as 0xRRGGBB. */
export const DEFAULT_TERRAIN_COLOR = 0x4f8f3a;

/**
 * Resolves material IDs to flat colors for terrain rendering.
 *
 * Built once from the loaded material registry and shared across the bake
 * pipeline, ChunkUploadQueue, and TerrainLayer. Keeping this as a plain
 * record means it can be passed to a Web Worker without serialization overhead.
 */
export class MaterialColorResolver {
  private readonly _colors: ReadonlyMap<string, number>;

  constructor(materials: ReadonlyMap<string, MaterialDef> | Record<string, MaterialDef>) {
    const map = new Map<string, number>();
    const entries =
      materials instanceof Map ? materials.entries() : Object.entries(materials);
    for (const [id, def] of entries) {
      if (def.color !== undefined) {
        map.set(id, def.color);
      }
    }
    this._colors = map;
  }

  /** Resolve a material ID to a 0xRRGGBB color, falling back to the default. */
  resolve(materialId: string): number {
    return this._colors.get(materialId) ?? DEFAULT_TERRAIN_COLOR;
  }

  /** Whether a material ID has an explicit color in the registry. */
  has(materialId: string): boolean {
    return this._colors.has(materialId);
  }

  /** Serialize to a plain record for Web Worker transfer. */
  toRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [id, color] of this._colors) {
      record[id] = color;
    }
    return record;
  }
}

/** Convert a 0xRRGGBB integer to normalized [r, g, b] floats (0..1). */
export function hexToRgb(hex: number): [number, number, number] {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return [r, g, b];
}

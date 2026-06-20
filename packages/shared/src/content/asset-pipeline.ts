/**
 * Pure item-asset pipeline logic (E41-S01).
 *
 * Deterministic, side-effect-free functions for composing silhouette + tier
 * palette into icon SVGs and packing them into a sprite atlas. Shared between
 * the build script (`items:build-assets`), the validator (`items:validate-assets`),
 * and the client `IconAtlas` so the three never drift on format.
 */
import type { AssetManifest, AtlasCell, AtlasIndex } from "../content-schemas/asset";

/** Magenta placeholder colour for missing/unresolved regions (visible, not blank). */
export const PLACEHOLDER_COLOR = "#ff00ff";

/** Canonical icon cell size in pixels (POC_SPEC §14, E41 approach). */
export const ICON_CELL_SIZE = 64;

/**
 * Compose a silhouette SVG with a region→colour map. Every element carrying a
 * `data-region="X"` attribute receives `fill="<colour>"`. Regions absent from
 * the map fall back to magenta so missing art is visible, not blank.
 *
 * Silhouettes are authored without `fill`; the composer is the single source of
 * colour. Output is deterministic: identical input always yields identical SVG.
 */
export function composeIconSilhouette(
  svg: string,
  regions: ReadonlyMap<string, string> | Record<string, string>,
): string {
  const map = regions instanceof Map ? regions : new Map(Object.entries(regions));
  return svg.replace(/data-region="([^"]+)"/g, (match, region: string) => {
    const color = map.get(region) ?? PLACEHOLDER_COLOR;
    return `${match} fill="${color}"`;
  });
}

/** A composed icon ready for atlas packing. */
export interface ComposedIcon {
  readonly id: string;
  readonly svg: string;
}

/** A packed atlas: the sprite-sheet SVG and its index. */
export interface PackedAtlas {
  readonly atlasSvg: string;
  readonly index: AtlasIndex;
}

/**
 * Pack composed icons into a single sprite-sheet SVG plus a JSON index.
 *
 * Icons are sorted by id (stable diffs) then laid out left-to-right, top-to-
 * bottom in a near-square grid of `cellSize`-pixel cells. The atlas SVG nests
 * each icon as an `<svg x y width height viewBox>` so the client can render the
 * whole sheet or address individual cells via the index.
 *
 * Deterministic: identical input always yields identical output.
 */
export function packIconAtlas(
  icons: readonly ComposedIcon[],
  cellSize = ICON_CELL_SIZE,
): PackedAtlas {
  const sorted = [...icons].toSorted((a, b) => a.id.localeCompare(b.id));
  const count = sorted.length;
  const cols = count === 0 ? 0 : Math.ceil(Math.sqrt(count));
  const rows = cols === 0 ? 0 : Math.ceil(count / cols);
  const width = cols * cellSize;
  const height = rows * cellSize;

  const cells: Record<string, AtlasCell> = {};
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const icon = sorted[i];
    if (!icon) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellSize;
    const y = row * cellSize;
    cells[icon.id] = { x, y, w: cellSize, h: cellSize };
    parts.push(
      `<svg x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" viewBox="0 0 ${cellSize} ${cellSize}">${icon.svg}</svg>`,
    );
  }

  const atlasSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;

  return {
    atlasSvg,
    index: { version: 1, atlas: "atlas-0.svg", cellSize, cells },
  };
}

/** A dangling asset reference found by {@link validateItemAssets}. */
export interface AssetValidationIssue {
  readonly itemId: string;
  readonly field: "icon" | "model";
  readonly assetId: string;
  readonly message: string;
}

/** Minimal item projection needed for asset cross-reference validation. */
export interface ItemAssetRef {
  readonly id: string;
  readonly icon: string;
  readonly model?: string | undefined;
}

/**
 * Cross-reference item `icon`/`model` AssetIds against the manifest. Returns one
 * issue per dangling reference. Empty result = every item art reference resolves.
 */
export function validateItemAssets(
  items: readonly ItemAssetRef[],
  manifest: AssetManifest,
): readonly AssetValidationIssue[] {
  const known = new Set(manifest.assets.map((a) => a.id));
  const issues: AssetValidationIssue[] = [];
  for (const item of items) {
    if (!known.has(item.icon)) {
      issues.push({
        itemId: item.id,
        field: "icon",
        assetId: item.icon,
        message: `item "${item.id}" references missing icon asset "${item.icon}"`,
      });
    }
    if (item.model !== undefined && !known.has(item.model)) {
      issues.push({
        itemId: item.id,
        field: "model",
        assetId: item.model,
        message: `item "${item.id}" references missing model asset "${item.model}"`,
      });
    }
  }
  return issues;
}

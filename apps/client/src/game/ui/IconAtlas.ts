/**
 * Client-side icon atlas loader (E41-S02).
 *
 * Fetches the atlas index JSON produced by `items:build-assets` and resolves
 * item `icon` AssetIds to atlas cells. Icons render as DOM `<img>`/background
 * elements (asset-baking contract §1: UI overlays are DOM/canvas, never the
 * Three.js scene graph). Unresolved AssetIds fall back to a visible magenta
 * placeholder so dangling art is caught immediately, not silently.
 *
 * The atlas itself is an SVG sprite sheet (`atlas-0.svg`); each cell is addressed
 * by its top-left pixel rect from the index. `resolveIcon` returns the data
 * needed for a background-image slice or an inline `<svg>` fragment.
 */
import type { AtlasCell, AtlasIndex } from "@old-town/shared";

/** A resolved icon: enough to render a DOM sprite from the atlas. */
export interface ResolvedIcon {
  /** Atlas URL (resolved relative to the server origin). */
  readonly atlasUrl: string;
  /** Pixel rect of this icon within the atlas. */
  readonly cell: AtlasCell;
  /** Cell size in px (convenience for sizing the DOM element). */
  readonly cellSize: number;
}

/** Magenta placeholder cell used when an icon is unresolved. */
export const PLACEHOLDER_CELL: AtlasCell = { x: 0, y: 0, w: 1, h: 1 };

/** Inline SVG for the missing-icon placeholder (magenta, clearly visible). */
export const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#ff00ff"/><text x="32" y="38" font-size="28" text-anchor="middle" fill="#000">?</text></svg>';

/** Data-URI form of the placeholder for `<img src>`. */
export const PLACEHOLDER_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

/**
 * Icon atlas client. Loaded once at startup alongside `ContentClient.load`.
 * Resolution is synchronous after load so UI re-renders never await.
 *
 * Two atlases are supported:
 * 1. The SVG sprite sheet (`atlas-0.svg` + `atlas-index.json`) — composed from
 *    silhouette + tier palette by `items:build-assets`.
 * 2. A raster PNG sprite sheet (`atlas-png-0.png` + `atlas-png-index.json`) —
 *    packed from Blender-rendered icons by `icons:pack-png`.
 *
 * Both atlases share the same `AtlasIndex` format. PNG cells take precedence
 * over SVG cells when an icon id exists in both, so Blender-rendered icons
 * override the procedural SVG ones transparently.
 */
export class IconAtlas {
  private _index: AtlasIndex | undefined;
  private _atlasUrl = "";
  private _ready = false;
  /** Raster PNG atlas cells, keyed by icon AssetId. */
  private _pngCells: Record<string, AtlasCell> | undefined;
  private _pngAtlasUrl = "";

  get ready(): boolean {
    return this._ready;
  }

  /** Atlas index (test/inspection accessor). */
  get index(): AtlasIndex | undefined {
    return this._index;
  }

  /**
   * Fetch the atlas index JSON from the server static path.
   * `httpBaseUrl` is the HTTP origin derived by `GameSocket.httpUrl`.
   * Failure is non-fatal: the UI falls back to placeholders so the client still
   * runs when art has not been built yet.
   */
  async load(httpBaseUrl: string): Promise<void> {
    const base = httpBaseUrl;
    const indexUrl = new URL("/assets/items/atlases/atlas-index.json", base);
    try {
      const response = await fetch(indexUrl.toString());
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as AtlasIndex;
      if (data && typeof data.cellSize === "number" && data.cells) {
        this._index = data;
        this._atlasUrl = new URL(`/assets/items/atlases/${data.atlas}`, base).toString();
        this._ready = true;
      }
    } catch {
      // Non-fatal: placeholders will render.
    }

    // Load the raster PNG atlas (optional — non-fatal if absent).
    const pngIndexUrl = new URL("/assets/items/atlases/atlas-png-index.json", base);
    try {
      const pngResp = await fetch(pngIndexUrl.toString());
      if (pngResp.ok) {
        const pngData = (await pngResp.json()) as AtlasIndex;
        if (pngData && typeof pngData.cellSize === "number" && pngData.cells) {
          this._pngCells = pngData.cells;
          this._pngAtlasUrl = new URL(`/assets/items/atlases/${pngData.atlas}`, base).toString();
        }
      }
    } catch {
      // Non-fatal: SVG atlas alone is sufficient.
    }
  }

  /**
   * Resolve an `icon` AssetId to an atlas cell. Returns `null` when no atlas
   * is loaded or the AssetId is absent — callers render the placeholder.
   *
   * PNG (Blender-rendered) cells take precedence over SVG cells.
   */
  resolveIcon(assetId: string): ResolvedIcon | null {
    if (this._pngCells && this._pngAtlasUrl) {
      const pngCell = this._pngCells[assetId];
      if (pngCell) {
        return { atlasUrl: this._pngAtlasUrl, cell: pngCell, cellSize: 64 };
      }
    }
    if (!this._index || !this._atlasUrl) return null;
    const cell = this._index.cells[assetId];
    if (!cell) return null;
    return { atlasUrl: this._atlasUrl, cell, cellSize: this._index.cellSize };
  }
}

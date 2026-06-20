/**
 * Icon texture factory for Three.js scene billboards (E41-S09).
 *
 * Loads the SVG atlas produced by `items:build-assets` as an HTMLImageElement,
 * then resolves individual icon AssetIds to `CanvasTexture` instances by
 * drawing the atlas cell rect onto a small canvas. Textures are cached per
 * AssetId so the hot path (ground item spawn, projectile spawn) never
 * allocates a new canvas or image.
 *
 * This is the 3D-scene counterpart to `IconAtlas` (which is DOM-only).
 */

import type { AtlasCell, AtlasIndex } from "@old-town/shared";
import { CanvasTexture, type Texture } from "three";

export class IconTextureFactory {
  private _index: AtlasIndex | undefined;
  private _atlasUrl = "";
  private _atlasImage: HTMLImageElement | undefined;
  private _ready = false;
  private readonly _textureCache = new Map<string, CanvasTexture>();
  private _cellSize: number;

  constructor(cellSize = 36) {
    this._cellSize = cellSize;
  }

  get ready(): boolean {
    return this._ready;
  }

  /**
   * Load the atlas index JSON and the atlas SVG image.
   * `httpBaseUrl` is the HTTP origin derived by `GameSocket.httpUrl`.
   */
  async load(httpBaseUrl: string): Promise<void> {
    const base = httpBaseUrl;
    const indexUrl = new URL("/assets/items/atlases/atlas-index.json", base);
    try {
      const response = await fetch(indexUrl.toString());
      if (!response.ok) return;
      const data = (await response.json()) as AtlasIndex;
      if (!data || typeof data.cellSize !== "number" || !data.cells) return;
      this._index = data;
      this._cellSize = data.cellSize;
      this._atlasUrl = new URL(`/assets/items/atlases/${data.atlas}`, base).toString();

      const image = new Image();
      image.src = this._atlasUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("atlas image load failed"));
      });
      this._atlasImage = image;
      this._ready = true;
    } catch {
      // Non-fatal: billboards fall back to gem/sphere
    }
  }

  /**
   * Resolve an `icon` AssetId to a cached `CanvasTexture`.
   * Returns `null` when the atlas is not loaded or the AssetId is absent.
   */
  resolveTexture(assetId: string): Texture | null {
    if (!this._ready || !this._index || !this._atlasImage) return null;
    const cached = this._textureCache.get(assetId);
    if (cached) return cached;

    const cell = this._index.cells[assetId] as AtlasCell | undefined;
    if (!cell) return null;

    const canvas = document.createElement("canvas");
    canvas.width = this._cellSize;
    canvas.height = this._cellSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      this._atlasImage,
      cell.x,
      cell.y,
      cell.w,
      cell.h,
      0,
      0,
      this._cellSize,
      this._cellSize,
    );

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    texture.needsUpdate = true;
    this._textureCache.set(assetId, texture);
    return texture;
  }

  dispose(): void {
    for (const texture of this._textureCache.values()) {
      texture.dispose();
    }
    this._textureCache.clear();
    this._ready = false;
  }
}

import { TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import type { Scene } from "three";
import {
  Group,
  type Mesh,
  MeshLambertMaterial,
  type Object3D,
  OctahedronGeometry,
  Sprite,
  SpriteMaterial,
  type Texture,
  Vector3,
} from "three";
import { MeshPool } from "../renderer/MeshPool";

interface GroundItem {
  readonly entityId: number;
  readonly tile: TileCoord;
  readonly itemId: string;
  readonly quantity: number;
  readonly mesh: Mesh | Sprite;
}

export interface GroundItemLayerOptions {
  readonly scene: Scene;
}

/** Optional resolver: given an item icon AssetId, return a displayable texture. */
export type IconTextureResolver = (iconAssetId: string) => Texture | null;

export class GroundItemLayer {
  private readonly scene: Scene;
  private readonly items = new Map<number, GroundItem>();
  private readonly group = new Group();
  private readonly meshPool: MeshPool;
  private _iconResolver: IconTextureResolver | null = null;
  private readonly _textureCache = new Map<string, Texture>();

  constructor(options: GroundItemLayerOptions) {
    this.scene = options.scene;
    this.group.name = "groundItems";
    this.scene.add(this.group);
    // Loot reads as a small faceted gold gem floating just above the tile.
    this.meshPool = new MeshPool({
      geometry: new OctahedronGeometry(0.22, 0),
      material: new MeshLambertMaterial({ color: 0xf0c33c, flatShading: true }),
      initialSize: 8,
      maxSize: 128,
    });
  }

  /** Set the icon texture resolver for atlas-backed billboards (E41-S09). */
  setIconResolver(resolver: IconTextureResolver | null): void {
    this._iconResolver = resolver;
  }

  spawn(
    entityId: number,
    tile: TileCoord,
    itemId: string,
    quantity: number,
    iconAssetId?: string,
  ): void {
    if (this.items.has(entityId)) {
      this.remove(entityId);
    }

    const world = this._tileToWorld(tile);

    // If we have an icon resolver and an icon AssetId, use a billboard sprite
    if (this._iconResolver && iconAssetId) {
      const texture = this._getOrCreateTexture(iconAssetId);
      if (texture) {
        const sprite = new Sprite(new SpriteMaterial({ map: texture, depthTest: true }));
        sprite.position.copy(world);
        sprite.position.y = 0.35;
        sprite.scale.set(0.5, 0.5, 1);
        sprite.name = `item_${entityId}`;
        sprite.userData = { entityId, kind: "groundItem", itemId, quantity };
        this.group.add(sprite);
        this.items.set(entityId, { entityId, tile, itemId, quantity, mesh: sprite });
        return;
      }
    }

    // Fallback: pooled octahedron gem
    const mesh = this.meshPool.acquire();
    if (!mesh) return;
    mesh.position.copy(world);
    mesh.position.y = 0.28;
    mesh.name = `item_${entityId}`;
    mesh.userData = { entityId, kind: "groundItem", itemId, quantity };
    this.group.add(mesh);
    this.items.set(entityId, { entityId, tile, itemId, quantity, mesh });
  }

  remove(entityId: number): void {
    const item = this.items.get(entityId);
    if (!item) return;
    this.group.remove(item.mesh);
    if (item.mesh instanceof Sprite) {
      (item.mesh.material as SpriteMaterial).dispose();
    } else {
      this.meshPool.release(item.mesh);
    }
    this.items.delete(entityId);
  }

  clear(): void {
    for (const id of this.items.keys()) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.meshPool.dispose();
    for (const texture of this._textureCache.values()) {
      texture.dispose();
    }
    this._textureCache.clear();
    this.scene.remove(this.group);
  }

  get itemCount(): number {
    return this.items.size;
  }

  /** Total pool size (active + idle). */
  get poolSize(): number {
    return this.meshPool.poolSize;
  }

  getRaycastTargets(): Object3D[] {
    const targets: Object3D[] = [];
    for (const item of this.items.values()) {
      targets.push(item.mesh);
    }
    return targets;
  }

  private _getOrCreateTexture(iconAssetId: string): Texture | null {
    if (!this._iconResolver) return null;
    const cached = this._textureCache.get(iconAssetId);
    if (cached) return cached;
    const texture = this._iconResolver(iconAssetId);
    if (texture) {
      this._textureCache.set(iconAssetId, texture);
    }
    return texture;
  }

  private _tileToWorld(tile: TileCoord): Vector3 {
    return new Vector3(tile.x * TILE_SIZE_WORLD_UNITS, 0, tile.y * TILE_SIZE_WORLD_UNITS);
  }
}

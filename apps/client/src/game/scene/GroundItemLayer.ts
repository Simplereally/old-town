import { TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import type { Scene } from "three";
import { BoxGeometry, Group, type Mesh, MeshLambertMaterial, Vector3 } from "three";
import { MeshPool } from "../renderer/MeshPool";

interface GroundItem {
  readonly entityId: number;
  readonly tile: TileCoord;
  readonly itemId: string;
  readonly quantity: number;
  readonly mesh: Mesh;
}

export interface GroundItemLayerOptions {
  readonly scene: Scene;
}

export class GroundItemLayer {
  private readonly scene: Scene;
  private readonly items = new Map<number, GroundItem>();
  private readonly group = new Group();
  private readonly meshPool: MeshPool;

  constructor(options: GroundItemLayerOptions) {
    this.scene = options.scene;
    this.group.name = "groundItems";
    this.scene.add(this.group);
    this.meshPool = new MeshPool({
      geometry: new BoxGeometry(0.3, 0.15, 0.3),
      material: new MeshLambertMaterial({ color: 0xd4a017 }),
      initialSize: 8,
    });
  }

  spawn(entityId: number, tile: TileCoord, itemId: string, quantity: number): void {
    if (this.items.has(entityId)) {
      this.remove(entityId);
    }

    const mesh = this.meshPool.acquire();
    const world = this._tileToWorld(tile);
    mesh.position.copy(world);
    mesh.position.y = 0.1;
    mesh.name = `item_${entityId}`;
    mesh.userData = { entityId, kind: "groundItem", itemId, quantity };
    this.group.add(mesh);

    this.items.set(entityId, { entityId, tile, itemId, quantity, mesh });
  }

  remove(entityId: number): void {
    const item = this.items.get(entityId);
    if (!item) return;
    this.group.remove(item.mesh);
    this.meshPool.release(item.mesh);
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
  }

  get itemCount(): number {
    return this.items.size;
  }

  getRaycastTargets(): Mesh[] {
    const targets: Mesh[] = [];
    for (const item of this.items.values()) {
      targets.push(item.mesh);
    }
    return targets;
  }

  private _tileToWorld(tile: TileCoord): Vector3 {
    return new Vector3(tile.x * TILE_SIZE_WORLD_UNITS, 0, -tile.y * TILE_SIZE_WORLD_UNITS);
  }
}

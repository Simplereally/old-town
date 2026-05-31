import { GAME_TICK_MS, TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import { Group, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import type { Mesh, Scene } from "three";
import { MeshPool } from "../renderer/MeshPool";

interface Projectile {
  readonly id: string;
  startTile: TileCoord;
  endTile: TileCoord;
  startTime: number;
  mesh: Mesh;
}

export interface ProjectileLayerOptions {
  readonly scene: Scene;
}

export class ProjectileLayer {
  private readonly scene: Scene;
  private readonly projectiles = new Map<string, Projectile>();
  private readonly group = new Group();
  private readonly meshPool: MeshPool;

  constructor(options: ProjectileLayerOptions) {
    this.scene = options.scene;
    this.group.name = "projectiles";
    this.scene.add(this.group);
    this.meshPool = new MeshPool({
      geometry: new SphereGeometry(0.15, 8, 8),
      material: new MeshBasicMaterial({ color: 0xff6600 }),
      initialSize: 8,
    });
  }

  /** Spawn a projectile from start to end tile. */
  spawn(id: string, startTile: TileCoord, endTile: TileCoord): void {
    if (this.projectiles.has(id)) {
      this.remove(id);
    }

    const mesh = this.meshPool.acquire();
    const startWorld = this._tileToWorld(startTile);
    mesh.position.copy(startWorld);
    mesh.position.y = 1.5;
    this.group.add(mesh);

    this.projectiles.set(id, {
      id,
      startTile,
      endTile,
      startTime: performance.now(),
      mesh,
    });
  }

  /** Remove a projectile. */
  remove(id: string): void {
    const proj = this.projectiles.get(id);
    if (!proj) return;
    this.group.remove(proj.mesh);
    this.meshPool.release(proj.mesh);
    this.projectiles.delete(id);
  }

  /** Update projectile positions (call every frame). */
  update(): void {
    const now = performance.now();
    for (const proj of this.projectiles.values()) {
      const duration = GAME_TICK_MS;
      const progress = Math.min((now - proj.startTime) / duration, 1);
      const startWorld = this._tileToWorld(proj.startTile);
      const endWorld = this._tileToWorld(proj.endTile);
      proj.mesh.position.lerpVectors(startWorld, endWorld, progress);
      proj.mesh.position.y = 1.5 + Math.sin(progress * Math.PI) * 2;
      if (progress >= 1) {
        this.remove(proj.id);
      }
    }
  }

  /** Clear all projectiles. */
  clear(): void {
    for (const id of this.projectiles.keys()) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.meshPool.dispose();
    this.scene.remove(this.group);
  }

  private _tileToWorld(tile: TileCoord): Vector3 {
    return new Vector3(tile.x * TILE_SIZE_WORLD_UNITS, 0, -tile.y * TILE_SIZE_WORLD_UNITS);
  }
}

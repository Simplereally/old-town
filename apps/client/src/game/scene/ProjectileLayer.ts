import { GAME_TICK_MS, TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import type { Mesh, Scene } from "three";
import { Group, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import { MeshPool } from "../renderer/MeshPool";

interface Projectile {
  readonly id: string;
  startTile: TileCoord;
  endTile: TileCoord;
  startTick: number;
  hitTick: number;
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
      maxSize: 64,
    });
  }

  /** Spawn a projectile from start to end tile. */
  spawn(
    id: string,
    startTile: TileCoord,
    endTile: TileCoord,
    startTick: number,
    hitTick: number,
  ): void {
    if (this.projectiles.has(id)) {
      this.remove(id);
    }

    const mesh = this.meshPool.acquire();
    if (!mesh) return;
    const startWorld = this._tileToWorld(startTile);
    mesh.position.copy(startWorld);
    mesh.position.y = 1.5;
    this.group.add(mesh);

    this.projectiles.set(id, {
      id,
      startTile,
      endTile,
      startTick,
      hitTick,
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
  update(renderServerTimeMs: number): void {
    const now = renderServerTimeMs;
    for (const proj of this.projectiles.values()) {
      const startTile = proj.startTile;
      const endTile = proj.endTile;
      const startTimeMs = proj.startTick * GAME_TICK_MS;
      const totalDurationMs = Math.max(1, proj.hitTick - proj.startTick) * GAME_TICK_MS;
      const mesh = proj.mesh;
      const id = proj.id;

      // Clamp to [0, 1]: render time runs ~1 tick behind the latest packet, so a
      // freshly spawned projectile can momentarily sample before its launch time.
      const progress = Math.max(0, Math.min((now - startTimeMs) / totalDurationMs, 1));
      const startWorld = this._tileToWorld(startTile);
      const endWorld = this._tileToWorld(endTile);
      mesh.position.lerpVectors(startWorld, endWorld, progress);
      mesh.position.y = 1.5 + Math.sin(progress * Math.PI) * 2;
      if (progress >= 1) {
        this.remove(id);
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

  /** Number of active projectiles. */
  get activeProjectiles(): number {
    return this.projectiles.size;
  }

  /** Total pool size (active + idle). */
  get poolSize(): number {
    return this.meshPool.poolSize;
  }

  private _tileToWorld(tile: TileCoord): Vector3 {
    return new Vector3(tile.x * TILE_SIZE_WORLD_UNITS, 0, tile.y * TILE_SIZE_WORLD_UNITS);
  }
}

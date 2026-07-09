import { TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import type { Scene } from "three";
import { Group, Mesh, MeshBasicMaterial, RingGeometry } from "three";
import { RenderObjectPool } from "../renderer/RenderObjectPool";

export interface ClickMarkerLayerOptions {
  readonly scene: Scene;
}

interface ClickMarker {
  readonly id: number;
  readonly mesh: Mesh;
  readonly startServerTimeMs: number;
  readonly tile: TileCoord;
}

/** Client-only visual feedback for walk clicks. Fades out over 1.5 s. */
const CLICK_MARKER_DURATION_MS = 1500;

export class ClickMarkerLayer {
  private readonly scene: Scene;
  private readonly group = new Group();
  private readonly pool: RenderObjectPool<Mesh>;
  private readonly markers = new Map<number, ClickMarker>();
  private readonly material: MeshBasicMaterial;
  private _nextId = 1;

  constructor(options: ClickMarkerLayerOptions) {
    this.scene = options.scene;
    this.group.name = "clickMarkers";
    this.scene.add(this.group);
    const geometry = new RingGeometry(0.3, 0.4, 16);
    this.material = new MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    this.pool = new RenderObjectPool<Mesh>({
      create: () => {
        const mesh = new Mesh(geometry, this.material);
        mesh.rotation.x = -Math.PI / 2;
        return mesh;
      },
      reset: (mesh) => {
        mesh.visible = false;
        mesh.position.set(0, 0, 0);
        this.material.opacity = 0.8;
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
      },
      initialSize: 1,
      maxSize: 4,
    });
  }

  show(tile: TileCoord, serverTimeMs: number): number {
    const id = this._nextId++;
    const mesh = this.pool.acquire();
    if (!mesh) return id;

    mesh.position.set(tile.x * TILE_SIZE_WORLD_UNITS, 0.05, tile.y * TILE_SIZE_WORLD_UNITS);
    mesh.visible = true;
    this.group.add(mesh);

    this.markers.set(id, { id, mesh, startServerTimeMs: serverTimeMs, tile });
    return id;
  }

  /** Remove markers whose destination tile matches the player's current tile. */
  clearIfArrived(tile: TileCoord): void {
    for (const [id, marker] of this.markers) {
      if (
        marker.tile.x === tile.x &&
        marker.tile.y === tile.y &&
        marker.tile.plane === tile.plane
      ) {
        this.remove(id);
      }
    }
  }

  remove(id: number): void {
    const marker = this.markers.get(id);
    if (!marker) return;
    this.group.remove(marker.mesh);
    this.pool.release(marker.mesh);
    this.markers.delete(id);
  }

  update(renderServerTimeMs: number): void {
    for (const [id, marker] of this.markers) {
      const elapsed = renderServerTimeMs - marker.startServerTimeMs;
      if (elapsed >= CLICK_MARKER_DURATION_MS) {
        this.remove(id);
        continue;
      }
      const material = this.material;
      material.opacity = 0.8 * (1 - elapsed / CLICK_MARKER_DURATION_MS);
    }
  }

  clear(): void {
    for (const id of this.markers.keys()) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.pool.dispose();
    this.scene.remove(this.group);
  }

  get activeCount(): number {
    return this.markers.size;
  }

  get poolSize(): number {
    return this.pool.poolSize;
  }
}

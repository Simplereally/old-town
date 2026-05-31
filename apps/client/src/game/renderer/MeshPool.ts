import { Mesh } from "three";
import type { BufferGeometry, Material } from "three";

interface PooledMesh {
  mesh: Mesh;
  inUse: boolean;
}

export interface MeshPoolOptions {
  readonly geometry: BufferGeometry;
  readonly material: Material;
  readonly initialSize?: number;
}

/**
 * Object pool for Three.js meshes to avoid repeated create/destroy overhead.
 * Critical for hit-splats, projectiles, and ground items which spawn/despawn rapidly.
 */
export class MeshPool {
  private readonly geometry: BufferGeometry;
  private readonly material: Material;
  private readonly pool: PooledMesh[] = [];
  private readonly meshToEntry = new Map<Mesh, PooledMesh>();
  private readonly freeList: PooledMesh[] = [];
  private _activeCount = 0;

  constructor(options: MeshPoolOptions) {
    this.geometry = options.geometry;
    this.material = options.material;
    const initialSize = options.initialSize ?? 8;
    for (let i = 0; i < initialSize; i++) {
      this._createMesh();
    }
  }

  /** Acquire a mesh from the pool. */
  acquire(): Mesh {
    const entry = this.freeList.pop() ?? this._createMesh();
    entry.inUse = true;
    this._activeCount++;
    entry.mesh.visible = true;
    return entry.mesh;
  }

  /** Release a mesh back to the pool. */
  release(mesh: Mesh): void {
    const entry = this.meshToEntry.get(mesh);
    if (!entry || !entry.inUse) return;
    entry.inUse = false;
    this._activeCount--;
    entry.mesh.visible = false;
    entry.mesh.position.set(0, 0, 0);
    entry.mesh.rotation.set(0, 0, 0);
    entry.mesh.scale.set(1, 1, 1);
    if (entry.mesh.parent) {
      entry.mesh.parent.remove(entry.mesh);
    }
    this.freeList.push(entry);
  }

  /** Number of currently active (acquired) meshes. */
  get activeCount(): number {
    return this._activeCount;
  }

  /** Total pool size (active + idle). */
  get poolSize(): number {
    return this.pool.length;
  }

  /** Dispose all meshes and resources. */
  dispose(): void {
    for (const entry of this.pool) {
      const mesh = entry.mesh;
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        for (const m of mesh.material) m.dispose();
      } else {
        mesh.material.dispose();
      }
    }
    this.pool.length = 0;
    this._activeCount = 0;
    this.geometry.dispose();
    this.material.dispose();
  }

  private _createMesh(): PooledMesh {
    const mesh = new Mesh(this.geometry.clone(), this.material.clone());
    mesh.visible = false;
    const entry: PooledMesh = { mesh, inUse: false };
    this.pool.push(entry);
    this.meshToEntry.set(mesh, entry);
    this.freeList.push(entry);
    return entry;
  }
}

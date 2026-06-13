import type { BufferGeometry, Material } from "three";
import { Mesh } from "three";
import { RenderObjectPool, type RenderObjectPoolOptions } from "./RenderObjectPool";

export interface MeshPoolOptions {
  readonly geometry: BufferGeometry;
  readonly material: Material;
  readonly initialSize?: number;
  readonly maxSize?: number;
}

/**
 * Object pool for Three.js meshes that share registry-owned geometry and material.
 *
 * Critical for hit-splats, projectiles, and ground items which spawn/despawn rapidly.
 * The pooled meshes share the same geometry and material instances; the caller is
 * responsible for disposing those shared resources when the pool is no longer needed.
 */
export class MeshPool {
  private readonly pool: RenderObjectPool<Mesh>;

  constructor(options: MeshPoolOptions) {
    const geometry = options.geometry;
    const material = options.material;
    const poolOptions = {
      create: () => {
        const mesh = new Mesh(geometry, material);
        mesh.visible = false;
        return mesh;
      },
      reset: (mesh: Mesh) => {
        mesh.visible = false;
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
      },
      ...(options.initialSize !== undefined ? { initialSize: options.initialSize } : {}),
      ...(options.maxSize !== undefined ? { maxSize: options.maxSize } : {}),
    } as RenderObjectPoolOptions<Mesh>;
    this.pool = new RenderObjectPool<Mesh>(poolOptions);
  }

  /** Acquire a mesh from the pool, or null if the pool is exhausted. */
  acquire(): Mesh | null {
    const mesh = this.pool.acquire();
    if (mesh) {
      mesh.visible = true;
    }
    return mesh;
  }

  /** Release a mesh back to the pool. */
  release(mesh: Mesh): void {
    this.pool.release(mesh);
  }

  /** Number of currently active (acquired) meshes. */
  get activeCount(): number {
    return this.pool.activeCount;
  }

  /** Total pool size (active + idle). */
  get poolSize(): number {
    return this.pool.poolSize;
  }

  private _disposed = false;

  /** Dispose all internal state. Does not dispose shared geometry or material. Idempotent. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.pool.dispose();
  }
}

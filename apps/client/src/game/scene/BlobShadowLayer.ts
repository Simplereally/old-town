/**
 * Cheap flat blob shadows under actors and selected static objects (E47-S03).
 * No real-time shadow maps — a shared CircleGeometry disc per entity.
 */
import { CircleGeometry, Group, Mesh, MeshBasicMaterial, type Scene, type Vector3 } from "three";

export interface BlobShadowLayerOptions {
  readonly scene: Scene;
  readonly radius?: number;
  readonly opacity?: number;
  readonly yOffset?: number;
}

export class BlobShadowLayer {
  private readonly scene: Scene;
  private readonly root: Group;
  private readonly geometry: CircleGeometry;
  private readonly material: MeshBasicMaterial;
  private readonly shadows = new Map<number, Mesh>();
  private readonly yOffset: number;
  private _disposed = false;

  constructor(options: BlobShadowLayerOptions) {
    this.scene = options.scene;
    this.yOffset = options.yOffset ?? 0.02;
    this.geometry = new CircleGeometry(options.radius ?? 0.35, 16);
    this.material = new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: options.opacity ?? 0.28,
      depthWrite: false,
    });
    this.root = new Group();
    this.root.name = "blob-shadows";
    this.scene.add(this.root);
  }

  get count(): number {
    return this.shadows.size;
  }

  ensure(entityId: number, position: Vector3, scale = 1): void {
    if (this._disposed) return;
    let mesh = this.shadows.get(entityId);
    if (!mesh) {
      mesh = new Mesh(this.geometry, this.material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.name = `blob-shadow-${entityId}`;
      this.root.add(mesh);
      this.shadows.set(entityId, mesh);
    }
    mesh.position.set(position.x, this.yOffset, position.z);
    mesh.scale.setScalar(scale);
    mesh.visible = true;
  }

  /** Sync actor shadows from a position map; removes shadows for missing ids. */
  syncActors(positions: ReadonlyMap<number, Vector3>): void {
    if (this._disposed) return;
    const seen = new Set<number>();
    for (const [entityId, position] of positions) {
      seen.add(entityId);
      this.ensure(entityId, position);
    }
    for (const entityId of this.shadows.keys()) {
      // Object shadows use negative ids; actor ids are positive entity ids.
      if (entityId < 0) continue;
      if (!seen.has(entityId)) this.remove(entityId);
    }
  }

  /** Place a static object shadow. Uses a negative key space to avoid actor collisions. */
  ensureObject(entityId: number, worldX: number, worldZ: number, scale = 1.2): void {
    if (this._disposed) return;
    const key = -entityId - 1;
    let mesh = this.shadows.get(key);
    if (!mesh) {
      mesh = new Mesh(this.geometry, this.material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.name = `blob-shadow-obj-${entityId}`;
      this.root.add(mesh);
      this.shadows.set(key, mesh);
    }
    mesh.position.set(worldX, this.yOffset, worldZ);
    mesh.scale.setScalar(scale);
    mesh.visible = true;
  }

  removeObject(entityId: number): void {
    this.remove(-entityId - 1);
  }

  remove(entityId: number): void {
    const mesh = this.shadows.get(entityId);
    if (!mesh) return;
    this.root.remove(mesh);
    this.shadows.delete(entityId);
  }

  clear(): void {
    for (const entityId of [...this.shadows.keys()]) {
      this.remove(entityId);
    }
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.clear();
    this.scene.remove(this.root);
    this.geometry.dispose();
    this.material.dispose();
  }
}

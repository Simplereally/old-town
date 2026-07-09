/**
 * Persistent selected-entity ring (E47-S04).
 * Distinct from HoverHighlighter (white): selection uses a warm gold ring.
 */
import { Mesh, MeshBasicMaterial, RingGeometry, type Scene, Vector3 } from "three";

export interface SelectionRingLayerOptions {
  readonly scene: Scene;
}

export class SelectionRingLayer {
  private readonly scene: Scene;
  private _mesh: Mesh | undefined;
  private _targetPosition: Vector3 | undefined;
  private _targetY = 0.04;
  private _targetEntityId: number | undefined;
  private readonly _geometry = new RingGeometry(0.48, 0.62, 20);
  private readonly _material = new MeshBasicMaterial({
    color: 0xd4a843,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  });
  private _disposed = false;

  constructor(options: SelectionRingLayerOptions) {
    this.scene = options.scene;
  }

  get selectedEntityId(): number | undefined {
    return this._targetEntityId;
  }

  get visible(): boolean {
    return this._mesh?.visible === true;
  }

  select(entityId: number, position: Vector3, yOffset = 0.04): void {
    if (this._disposed) return;
    this._targetEntityId = entityId;
    this._targetY = yOffset;
    this._targetPosition = position.clone();
    let mesh = this._mesh;
    if (!mesh) {
      mesh = new Mesh(this._geometry, this._material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.name = "selection-ring";
      this.scene.add(mesh);
      this._mesh = mesh;
    }
    mesh.visible = true;
    this._updatePosition();
  }

  clear(): void {
    if (this._mesh) this._mesh.visible = false;
    this._targetPosition = undefined;
    this._targetEntityId = undefined;
  }

  updateFromCache(cache: import("../renderer/RenderTransformCache").RenderTransformCache): void {
    if (this._targetEntityId === undefined || !this._mesh) return;
    const presentation = cache.getPresentation(this._targetEntityId);
    if (!presentation) {
      this.clear();
      return;
    }
    if (!this._targetPosition) this._targetPosition = new Vector3();
    this._targetPosition.set(
      presentation.renderX,
      presentation.renderY + this._targetY,
      presentation.renderZ,
    );
    this._updatePosition();
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.clear();
    if (this._mesh) {
      this.scene.remove(this._mesh);
      this._mesh = undefined;
    }
    this._geometry.dispose();
    this._material.dispose();
  }

  private _updatePosition(): void {
    if (!this._mesh || !this._targetPosition) return;
    this._mesh.position.copy(this._targetPosition);
    this._mesh.position.y = this._targetY;
  }
}

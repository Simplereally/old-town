import { Vector3, type Scene } from "three";
import { Mesh, MeshBasicMaterial, RingGeometry } from "three";

export interface HoverHighlighterOptions {
  readonly scene: Scene;
}

/**
 * Hover highlight: a ring outline around the currently hovered entity.
 * Follows the entity mesh position each frame.
 */
export class HoverHighlighter {
  private readonly scene: Scene;
  private _highlightMesh: Mesh | undefined;
  private _targetPosition: Vector3 | undefined;
  private _targetY = 0;
  private _targetEntityId: number | undefined;
  private readonly _ringGeometry = new RingGeometry(0.4, 0.5, 16);
  private readonly _highlightMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
  });

  constructor(options: HoverHighlighterOptions) {
    this.scene = options.scene;
  }

  /**
   * Highlight an entity at the given world position.
   * @param position - world position of the entity center
   * @param yOffset - vertical offset (e.g., 0.05 for ground items, 0.8 for actors)
   */
  highlight(position: Vector3, yOffset = 0.05): void {
    this._targetPosition = position.clone();
    this._targetY = yOffset;
    let mesh = this._highlightMesh;
    if (!mesh) {
      mesh = new Mesh(this._ringGeometry, this._highlightMaterial);
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
      this._highlightMesh = mesh;
    }
    mesh.visible = true;
    this._updatePosition();
  }

  /** Set the entity id currently being followed. */
  setTargetEntityId(entityId: number | undefined): void {
    this._targetEntityId = entityId;
  }

  /** Hide the highlight. */
  hide(): void {
    if (this._highlightMesh) {
      this._highlightMesh.visible = false;
    }
    this._targetPosition = undefined;
    this._targetEntityId = undefined;
  }

  /** Update highlight position (call every frame if following a moving target). */
  update(): void {
    if (this._highlightMesh && this._targetPosition) {
      this._updatePosition();
    }
  }

  /** Update position from RenderTransformCache for the tracked entity. */
  updateFromCache(cache: import("../renderer/RenderTransformCache").RenderTransformCache): void {
    if (this._targetEntityId === undefined || !this._highlightMesh) return;
    const presentation = cache.getPresentation(this._targetEntityId);
    if (!presentation) {
      this.hide();
      return;
    }
    if (!this._targetPosition) {
      this._targetPosition = new Vector3();
    }
    this._targetPosition.set(presentation.renderX, presentation.renderY + this._targetY, presentation.renderZ);
    this._updatePosition();
  }

  /** Dispose resources. */
  dispose(): void {
    this.hide();
    this._ringGeometry.dispose();
    this._highlightMaterial.dispose();
  }

  private _updatePosition(): void {
    if (!this._highlightMesh || !this._targetPosition) return;
    this._highlightMesh.position.copy(this._targetPosition);
    this._highlightMesh.position.y = this._targetY;
  }
}

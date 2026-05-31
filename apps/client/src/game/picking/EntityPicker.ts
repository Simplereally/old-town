import { Raycaster, Vector2 } from "three";
import type { Mesh, OrthographicCamera } from "three";

export interface EntityPickerOptions {
  readonly camera: OrthographicCamera;
  readonly canvas: HTMLCanvasElement;
}

export interface PickedEntity {
  readonly entityId: number;
  readonly kind: "player" | "npc" | "object" | "groundItem";
  readonly defId?: string;
  readonly itemId?: string;
  readonly quantity?: number;
  readonly distance: number;
}

/**
 * Raycast-based entity picker. Checks actors, objects, and ground items
 * and returns the closest intersected entity.
 */
export class EntityPicker {
  private readonly raycaster: Raycaster;
  private readonly camera: OrthographicCamera;
  private readonly canvas: HTMLCanvasElement;

  constructor(options: EntityPickerOptions) {
    this.camera = options.camera;
    this.canvas = options.canvas;
    this.raycaster = new Raycaster();
  }

  /**
   * Raycast against a list of meshes and return the closest picked entity.
   */
  pick(screenX: number, screenY: number, meshes: Mesh[]): PickedEntity | null {
    const ndc = this._screenToNDC(screenX, screenY);
    this.raycaster.setFromCamera(ndc, this.camera);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length === 0) return null;

    const closest = intersects[0];
    if (!closest) return null;
    const mesh = closest.object as Mesh;
    const userData = mesh.userData;
    if (!userData || typeof userData.entityId !== "number") return null;

    return {
      entityId: userData.entityId,
      kind: userData.kind,
      defId: userData.defId,
      itemId: userData.itemId,
      quantity: userData.quantity,
      distance: closest.distance,
    };
  }

  private _screenToNDC(screenX: number, screenY: number): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return new Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1,
    );
  }
}

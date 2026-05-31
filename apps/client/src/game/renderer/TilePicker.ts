import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { OrthographicCamera } from "three";

export interface TilePickerOptions {
  readonly camera: OrthographicCamera;
  readonly canvas: HTMLCanvasElement;
}

/**
 * Screen-to-tile picking helper.
 * Converts mouse/touch coordinates to tile coordinates on the ground plane.
 */
export class TilePicker {
  readonly raycaster: Raycaster;
  readonly groundPlane: Plane;
  private readonly camera: OrthographicCamera;
  private readonly canvas: HTMLCanvasElement;

  constructor(options: TilePickerOptions) {
    this.camera = options.camera;
    this.canvas = options.canvas;
    this.raycaster = new Raycaster();
    this.groundPlane = new Plane(new Vector3(0, 1, 0), 0);
  }

  /**
   * Convert screen pixel coordinates to a world position on the ground plane.
   */
  screenToGroundPoint(screenX: number, screenY: number): Vector3 | null {
    const ndc = this._screenToNDC(screenX, screenY);
    this.raycaster.setFromCamera(ndc, this.camera);
    const target = new Vector3();
    const didHit = this.raycaster.ray.intersectPlane(this.groundPlane, target);
    return didHit ? target : null;
  }

  /**
   * Convert screen pixel coordinates to tile coordinates (integer, floor).
   */
  screenToTile(screenX: number, screenY: number): { x: number; y: number } | null {
    const world = this.screenToGroundPoint(screenX, screenY);
    if (!world) return null;
    return {
      x: Math.floor(world.x + 0.5),
      y: Math.floor(-world.z + 0.5),
    };
  }

  /**
   * Convert screen pixel coordinates to normalized device coordinates (-1..1).
   */
  private _screenToNDC(screenX: number, screenY: number): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return new Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1,
    );
  }
}

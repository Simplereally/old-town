import { MathUtils, type OrthographicCamera, type Vector3 } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface CameraControllerOptions {
  readonly camera: OrthographicCamera;
  readonly controls: OrbitControls;
  readonly canvas: HTMLCanvasElement;
}

/**
 * Camera controller with OSRS-like semi-fixed isometric angle.
 * Supports pan, zoom, and optional rotation (dev mode).
 */
export class CameraController {
  readonly camera: OrthographicCamera;
  readonly controls: OrbitControls;

  private _baseFrustumSize = 40;
  private _minZoom = 0.2;
  private _maxZoom = 6;
  private _isometricAngle = true;

  constructor(options: CameraControllerOptions) {
    this.camera = options.camera;
    this.controls = options.controls;

    // Set up isometric-like orientation
    this._setIsometricAngle();

    // Constrain zoom
    this.controls.minZoom = this._minZoom;
    this.controls.maxZoom = this._maxZoom;
  }

  private _setIsometricAngle(): void {
    // Classic OSRS-like angle: elevated looking down at ~45 degrees, south-east-ish
    const distance = 60;
    const angle = MathUtils.degToRad(45);
    const azimuth = MathUtils.degToRad(45); // South-east default

    this.camera.position.set(
      distance * Math.cos(angle) * Math.sin(azimuth),
      distance * Math.sin(angle),
      distance * Math.cos(angle) * Math.cos(azimuth),
    );
    this.camera.lookAt(0, 0, 0);
  }

  /** Update frustum size when window resizes. */
  updateAspect(width: number, height: number): void {
    const aspect = width / height;
    const baseFrustumSize = this._baseFrustumSize;
    this.camera.left = -baseFrustumSize * aspect;
    this.camera.right = baseFrustumSize * aspect;
    this.camera.top = baseFrustumSize;
    this.camera.bottom = -baseFrustumSize;
    this.camera.updateProjectionMatrix();
  }

  /** Set camera target to follow a world position. */
  followTarget(target: Vector3): void {
    this.controls.target.copy(target);
    this.controls.update();
  }

  /** Snap to isometric angle. */
  snapIsometric(): void {
    this._setIsometricAngle();
  }

  /** Toggle free rotation vs fixed isometric. */
  setIsometricAngle(enabled: boolean): void {
    this._isometricAngle = enabled;
    this.controls.enableRotate = !enabled;
    if (enabled) {
      this._setIsometricAngle();
    }
  }

  get isometricAngle(): boolean {
    return this._isometricAngle;
  }

  /** Set zoom limits. */
  setZoomLimits(min: number, max: number): void {
    this._minZoom = min;
    this._maxZoom = max;
    this.controls.minZoom = min;
    this.controls.maxZoom = max;
  }

  dispose(): void {
    this.controls.dispose();
  }
}

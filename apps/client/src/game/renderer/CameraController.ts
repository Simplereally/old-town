import { MathUtils, type OrthographicCamera, Vector3 } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GlobalKeydownBus } from "../ui/GlobalKeydownBus";

export interface CameraControllerOptions {
  readonly camera: OrthographicCamera;
  readonly controls: OrbitControls;
  readonly canvas: HTMLCanvasElement;
}

/**
 * Camera controller with OSRS-like semi-fixed isometric angle.
 * Supports zoom and arrow-key rotation. Mouse buttons are left free for
 * gameplay (left-click movement, right-click context menu); camera direction
 * is changed only via the arrow keys, matching OSRS camera controls.
 */
export class CameraController {
  readonly camera: OrthographicCamera;
  readonly controls: OrbitControls;

  private _baseFrustumSize = 40;
  private _minZoom = 0.2;
  private _maxZoom = 6;
  private _isometricAngle = true;

  /** Radians of camera rotation per second while an arrow key is held. */
  private static readonly _KEY_ROTATE_SPEED = MathUtils.degToRad(120);

  private readonly _heldKeys = new Set<string>();
  private _keyupListener: ((e: KeyboardEvent) => void) | null = null;
  private _blurListener: (() => void) | null = null;

  constructor(options: CameraControllerOptions) {
    this.camera = options.camera;
    this.controls = options.controls;

    // Set up isometric-like orientation
    this._setIsometricAngle();

    // Constrain zoom
    this.controls.minZoom = this._minZoom;
    this.controls.maxZoom = this._maxZoom;

    // Disable all mouse-driven camera rotation/panning so the mouse is free
    // for gameplay input (left-click movement, right-click context menu).
    // Wheel zoom remains enabled. Camera direction is controlled only via
    // the arrow keys (see _handleKeyDown / update).
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: null,
      RIGHT: null,
    };

    GlobalKeydownBus.register("camera-controller", this._handleKeyDown);

    this._keyupListener = (e: KeyboardEvent) => this._handleKeyUp(e);
    document.addEventListener("keyup", this._keyupListener);

    // Clear held keys when the window loses focus (e.g. alt-tab) so a key
    // released outside the window doesn't leave the camera spinning.
    this._blurListener = () => this._heldKeys.clear();
    window.addEventListener("blur", this._blurListener);
  }

  private _handleKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        break;
      default:
        return;
    }
    // Prevent the page from scrolling while rotating the camera.
    event.preventDefault();
    this._heldKeys.add(event.key);
  };

  private _handleKeyUp = (event: KeyboardEvent): void => {
    this._heldKeys.delete(event.key);
  };

  /** Per-frame update: apply continuous rotation for held arrow keys. */
  update(deltaTime: number): void {
    if (!this.controls.enabled || !this.controls.enableRotate) return;
    if (this._heldKeys.size === 0) return;

    const step = CameraController._KEY_ROTATE_SPEED * deltaTime;
    if (this._heldKeys.has("ArrowLeft")) {
      this.controls.rotateLeft(step);
    }
    if (this._heldKeys.has("ArrowRight")) {
      this.controls.rotateLeft(-step);
    }
    if (this._heldKeys.has("ArrowUp")) {
      this.controls.rotateUp(step);
    }
    if (this._heldKeys.has("ArrowDown")) {
      this.controls.rotateUp(-step);
    }
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

  private readonly _followDelta = new Vector3();

  /** Set camera target to follow a world position. Moves both the target and
   *  the camera position by the same delta so the relative offset is preserved.
   *  OrbitControls.update() alone would keep the camera at its absolute
   *  position and only change the look-at point. */
  followTarget(target: Vector3): void {
    this._followDelta.copy(target).sub(this.controls.target);
    this.controls.target.copy(target);
    this.camera.position.add(this._followDelta);
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
    GlobalKeydownBus.unregister("camera-controller");
    if (this._keyupListener) {
      document.removeEventListener("keyup", this._keyupListener);
      this._keyupListener = null;
    }
    if (this._blurListener) {
      window.removeEventListener("blur", this._blurListener);
      this._blurListener = null;
    }
    this.controls.dispose();
  }
}

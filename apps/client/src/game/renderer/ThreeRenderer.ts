import { TILE_SIZE_WORLD_UNITS } from "@old-town/shared";
import { Color, OrthographicCamera, Scene, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CameraController } from "./CameraController";
import { GridOverlay } from "./GridOverlay";
import { TilePicker } from "./TilePicker";

export interface ThreeRendererOptions {
  readonly canvas: HTMLCanvasElement;
  readonly initialWidth?: number;
  readonly initialHeight?: number;
}

/**
 * Three.js renderer shell. Owns the WebGL context, render loop, and camera.
 * No gameplay truth lives here — only presentation.
 */
export class ThreeRenderer {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: OrthographicCamera;
  readonly cameraController: CameraController;
  readonly tilePicker: TilePicker;
  readonly gridOverlay: GridOverlay;

  private _running = false;
  private _animationFrameId: number | null = null;
  private _lastFrameTime = 0;
  private _frameCount = 0;
  private _fps = 0;
  private _fpsUpdateTime = 0;
  private _width = 0;
  private _height = 0;
  private _dpr = 1;
  private _pixelRatioCap = 2;

  onFrame?: (deltaTime: number, elapsedTime: number) => void;
  onResize?: (width: number, height: number) => void;

  constructor(options: ThreeRendererOptions) {
    const { canvas, initialWidth, initialHeight } = options;

    // Renderer setup
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(new Color(0x87ceeb), 1);
    this.renderer.shadowMap.enabled = false;

    // Scene
    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb);

    // Orthographic camera
    const aspect = 1;
    const frustumSize = 40;
    this.camera = new OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      0.1,
      1000,
    );

    // Controls
    const controls = new OrbitControls(this.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.minZoom = 0.2;
    controls.maxZoom = 4;
    controls.target.set(0, 0, 0);

    // Camera controller
    this.cameraController = new CameraController({
      camera: this.camera,
      controls,
      canvas,
    });

    // Tile picker
    this.tilePicker = new TilePicker({ camera: this.camera, canvas });

    // Grid overlay
    this.gridOverlay = new GridOverlay({ scene: this.scene });

    // Initial size
    this._width = initialWidth ?? window.innerWidth;
    this._height = initialHeight ?? window.innerHeight;
    this._updateSize();

    // Resize listener
    window.addEventListener("resize", this._handleResize);
  }

  private _resizeTimeoutId: number | null = null;
  private _resizeDebounceMs = 100;

  private _handleResize = (): void => {
    if (this._resizeTimeoutId !== null) {
      clearTimeout(this._resizeTimeoutId);
    }
    this._resizeTimeoutId = window.setTimeout(() => {
      this._width = window.innerWidth;
      this._height = window.innerHeight;
      this._updateSize();
      this._resizeTimeoutId = null;
    }, this._resizeDebounceMs);
  };

  private _updateSize(): void {
    const dpr = Math.min(window.devicePixelRatio, this._pixelRatioCap);
    if (dpr !== this._dpr) {
      this._dpr = dpr;
      this.renderer.setPixelRatio(dpr);
    }
    this.renderer.setSize(this._width, this._height, false);
    this.cameraController.updateAspect(this._width, this._height);
    this.onResize?.(this._width, this._height);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get fps(): number {
    return this._fps;
  }

  get running(): boolean {
    return this._running;
  }

  start(): void {
    if (this._running) return;
    this._running = true;
    this._lastFrameTime = performance.now();
    this._animationFrameId = requestAnimationFrame(this._renderLoop);
  }

  stop(): void {
    this._running = false;
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  private _renderLoop = (time: number): void => {
    if (!this._running) return;

    const deltaTime = Math.min((time - this._lastFrameTime) / 1000, 0.1);
    this._lastFrameTime = time;

    // FPS counter
    this._frameCount++;
    if (time - this._fpsUpdateTime >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._fpsUpdateTime = time;
    }

    this.cameraController.controls.update();
    this.onFrame?.(deltaTime, time / 1000);
    this.renderer.render(this.scene, this.camera);

    this._animationFrameId = requestAnimationFrame(this._renderLoop);
  };

  /**
   * Convert a tile coordinate to world space.
   * Y is up (world), but tiles are on the ground plane.
   */
  tileToWorld(x: number, y: number, height = 0): Vector3 {
    return new Vector3(x * TILE_SIZE_WORLD_UNITS, height, -y * TILE_SIZE_WORLD_UNITS);
  }

  /**
   * Convert world space to tile coordinate (integer, floor).
   */
  worldToTile(worldX: number, worldZ: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / TILE_SIZE_WORLD_UNITS + 0.5),
      y: Math.floor(-worldZ / TILE_SIZE_WORLD_UNITS + 0.5),
    };
  }

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this._handleResize);
    if (this._resizeTimeoutId !== null) {
      clearTimeout(this._resizeTimeoutId);
      this._resizeTimeoutId = null;
    }
    this.cameraController.dispose();
    this.gridOverlay.dispose();
    this.renderer.dispose();
  }
}

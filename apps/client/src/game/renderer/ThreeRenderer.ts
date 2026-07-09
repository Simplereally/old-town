import { TILE_SIZE_WORLD_UNITS } from "@old-town/shared";
import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CameraController } from "./CameraController";
import { GridOverlay } from "./GridOverlay";
import { TilePicker } from "./TilePicker";

export interface ThreeRendererOptions {
  readonly canvas: HTMLCanvasElement;
  readonly initialWidth?: number;
  readonly initialHeight?: number;
}

export interface RendererDebugCounters {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly drawCalls: number;
  readonly geometries: number;
  readonly textures: number;
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
  /** Existing hemisphere fill light — reused by AtmosphereController (E47-S03). */
  readonly hemisphereLight: HemisphereLight;
  /** Existing directional sun — reused by AtmosphereController (E47-S03). */
  readonly directionalLight: DirectionalLight;

  private _running = false;
  private _animationFrameId: number | null = null;
  private _lastFrameTime = 0;
  private _lastFrameDurationMs = 0;
  private _frameCount = 0;
  private _fps = 0;
  private _fpsUpdateTime = 0;
  private _width = 0;
  private _height = 0;
  private _dpr = 1;
  private _pixelRatioCap = 2;

  onFrame?: (deltaTime: number, elapsedTime: number, rafNowMs?: number) => void;
  onResize?: (width: number, height: number) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;

  private _contextLost = false;

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

    // Context loss / restore
    canvas.addEventListener("webglcontextlost", this._handleContextLost);
    canvas.addEventListener("webglcontextrestored", this._handleContextRestored);

    // Scene
    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb);

    // Lighting — without this every MeshLambertMaterial in the scene renders
    // pure black. The hemisphere light fills shadows with a sky/ground tint
    // while the directional "sun" defines the facet edges that give the
    // low-poly world its readable shape. AtmosphereController mutates these
    // in place for day/night — do not add duplicate default lights.
    this.hemisphereLight = new HemisphereLight(0xdcefff, 0x4a6b3a, 2.1);
    this.hemisphereLight.position.set(0, 60, 0);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new DirectionalLight(0xfff3df, 2.6);
    this.directionalLight.position.set(45, 90, 30);
    this.scene.add(this.directionalLight);

    // Distance haze: the streamed chunk edge dissolves into the sky colour
    // instead of revealing a hard horizon line.
    this.scene.fog = new Fog(0x87ceeb, 75, 150);

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
    // Default to an OSRS-like viewing distance (~20 tiles tall) instead of the
    // zoom=1 fully-zoomed-out frustum, which renders the player as a speck.
    this.camera.zoom = 4;
    this.camera.updateProjectionMatrix();

    // Controls
    const controls = new OrbitControls(this.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.minZoom = 0.2;
    controls.maxZoom = 6;
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

  private _handleContextLost = (event: Event): void => {
    event.preventDefault();
    this._contextLost = true;
    this.stop();
    this.onContextLost?.();
  };

  private _handleContextRestored = (): void => {
    this._contextLost = false;
    this.onContextRestored?.();
    this.start();
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

  debugCounters(): RendererDebugCounters {
    return {
      fps: this._fps,
      frameTimeMs: this._lastFrameDurationMs,
      drawCalls: this.renderer.info.render.calls,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
  }

  get running(): boolean {
    return this._running;
  }

  get contextLost(): boolean {
    return this._contextLost;
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

    const frameStart = performance.now();
    const deltaTime = Math.min((time - this._lastFrameTime) / 1000, 0.1);
    this._lastFrameTime = time;

    // FPS counter
    this._frameCount++;
    if (time - this._fpsUpdateTime >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._fpsUpdateTime = time;
    }

    this.cameraController.update(deltaTime);
    this.onFrame?.(deltaTime, time / 1000, time);
    this.cameraController.controls.update();
    this.renderer.render(this.scene, this.camera);
    this._lastFrameDurationMs = performance.now() - frameStart;

    this._animationFrameId = requestAnimationFrame(this._renderLoop);
  };

  /**
   * Convert a tile coordinate to world space.
   * Y is up (world), but tiles are on the ground plane.
   */
  tileToWorld(x: number, y: number, height = 0): Vector3 {
    return new Vector3(x * TILE_SIZE_WORLD_UNITS, height, y * TILE_SIZE_WORLD_UNITS);
  }

  /**
   * Convert world space to tile coordinate (integer, floor).
   */
  worldToTile(worldX: number, worldZ: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / TILE_SIZE_WORLD_UNITS + 0.5),
      y: Math.floor(worldZ / TILE_SIZE_WORLD_UNITS + 0.5),
    };
  }

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this._handleResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("webglcontextlost", this._handleContextLost);
    canvas.removeEventListener("webglcontextrestored", this._handleContextRestored);
    if (this._resizeTimeoutId !== null) {
      clearTimeout(this._resizeTimeoutId);
      this._resizeTimeoutId = null;
    }
    this.cameraController.dispose();
    this.gridOverlay.dispose();
    this.renderer.dispose();
  }
}

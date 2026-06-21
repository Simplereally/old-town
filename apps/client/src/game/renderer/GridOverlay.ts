import { GridHelper, type Scene } from "three";

export interface GridOverlayOptions {
  readonly scene: Scene;
  readonly tileSize?: number;
  readonly gridSize?: number;
  readonly color?: number;
  readonly opacity?: number;
}

/**
 * Visual grid overlay for debugging tile alignment.
 * Togglable and lightweight.
 */
export class GridOverlay {
  private readonly grid: GridHelper;
  private readonly scene: Scene;
  private _visible = false;

  constructor(options: GridOverlayOptions) {
    const { scene, tileSize = 1, gridSize = 64, color = 0x444444, opacity = 0.3 } = options;

    this.scene = scene;
    this.grid = new GridHelper(gridSize * tileSize, gridSize, color, color);
    this.grid.position.y = 0.01; // Slightly above ground
    this.grid.material.transparent = true;
    this.grid.material.opacity = opacity;
    this.grid.visible = false;
    this.scene.add(this.grid);
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
    this.grid.visible = value;
  }

  toggle(): void {
    this.visible = !this.visible;
  }

  dispose(): void {
    const grid = this.grid;
    this.scene.remove(grid);
    grid.geometry.dispose();
    if (Array.isArray(grid.material)) {
      for (const m of grid.material) m.dispose();
    } else {
      grid.material.dispose();
    }
  }
}

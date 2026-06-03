import type { MinimapEntity, MinimapTile } from "./UIState";

export interface MinimapData {
  readonly playerTile: { x: number; y: number } | undefined;
  readonly tiles: ReadonlyMap<string, MinimapTile>;
  readonly entities: ReadonlyMap<number, MinimapEntity>;
}

export interface MinimapOptions {
  readonly canvas: HTMLCanvasElement;
  readonly data: MinimapData;
  readonly getObjectName?: ((defId: string) => string | undefined) | undefined;
}

const UNDERLAY_COLORS: Record<string, string> = {
  grass: "#4a8c4a",
  dirt: "#8b7355",
  stone: "#7a7a7a",
  water: "#4a90d9",
  floor: "#8b6f47",
  sand: "#c2b280",
  forest: "#2d5a27",
  mud: "#5c4033",
  cobble: "#696969",
  path: "#a08060",
  default: "#4a8c4a",
};

function isPoi(defId: string, name?: string): boolean {
  const hay = `${defId} ${name ?? ""}`.toLowerCase();
  return hay.includes("bank") || hay.includes("shop") || hay.includes("shrine");
}

function isBank(defId: string, name?: string): boolean {
  const hay = `${defId} ${name ?? ""}`.toLowerCase();
  return hay.includes("bank");
}

function isShop(defId: string, name?: string): boolean {
  const hay = `${defId} ${name ?? ""}`.toLowerCase();
  return hay.includes("shop");
}

function isShrine(defId: string, name?: string): boolean {
  const hay = `${defId} ${name ?? ""}`.toLowerCase();
  return hay.includes("shrine");
}

function underlayColor(underlayId: string): string {
  return UNDERLAY_COLORS[underlayId] ?? UNDERLAY_COLORS.default ?? "#4a8c4a";
}

export class Minimap {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly data: MinimapData;
  private readonly getObjectName?: ((defId: string) => string | undefined) | undefined;
  private readonly _tileSize = 2;
  private readonly _viewRadius = 32;
  private _width = 0;
  private _height = 0;

  constructor(options: MinimapOptions) {
    this.canvas = options.canvas;
    this.data = options.data;
    this.getObjectName = options.getObjectName;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context not available");
    }
    this.ctx = ctx;
    this._resize();
  }

  private _resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const size = this._viewRadius * 2 * this._tileSize;
    this._width = size;
    this._height = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(): void {
    const player = this.data.playerTile;
    if (!player) {
      this.ctx.clearRect(0, 0, this._width, this._height);
      return;
    }

    const cx = player.x;
    const cy = player.y;
    const minX = cx - this._viewRadius;
    const minY = cy - this._viewRadius;
    const maxX = cx + this._viewRadius;
    const maxY = cy + this._viewRadius;

    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this._width, this._height);

    for (const tile of this.data.tiles.values()) {
      if (tile.x < minX || tile.x > maxX || tile.y < minY || tile.y > maxY) continue;
      const screenX = (tile.x - minX) * this._tileSize;
      const screenY = (maxY - tile.y) * this._tileSize;
      this.ctx.fillStyle = tile.water ? "#4a90d9" : underlayColor(tile.underlayId);
      this.ctx.fillRect(screenX, screenY, this._tileSize, this._tileSize);
    }

    for (const entity of this.data.entities.values()) {
      if (entity.tile.x < minX || entity.tile.x > maxX || entity.tile.y < minY || entity.tile.y > maxY) continue;
      const screenX = (entity.tile.x - minX) * this._tileSize;
      const screenY = (maxY - entity.tile.y) * this._tileSize;

      if (entity.kind === "object") {
        const name = this.getObjectName?.(entity.defId ?? "");
        if (isPoi(entity.defId ?? "", name)) {
          if (isBank(entity.defId ?? "", name)) {
            this.ctx.fillStyle = "#ffcc00";
          } else if (isShop(entity.defId ?? "", name)) {
            this.ctx.fillStyle = "#00ccff";
          } else if (isShrine(entity.defId ?? "", name)) {
            this.ctx.fillStyle = "#cc00ff";
          } else {
            this.ctx.fillStyle = "#ff6600";
          }
          this.ctx.fillRect(screenX - 1, screenY - 1, 4, 4);
        } else {
          this.ctx.fillStyle = "#888888";
          this.ctx.fillRect(screenX, screenY, 2, 2);
        }
      } else if (entity.kind === "npc") {
        this.ctx.fillStyle = "#ffff00";
        this.ctx.fillRect(screenX, screenY, 2, 2);
      } else if (entity.kind === "player") {
        this.ctx.fillStyle = "#00ff00";
        this.ctx.fillRect(screenX, screenY, 2, 2);
      }
    }

    const px = (cx - minX) * this._tileSize;
    const py = (maxY - cy) * this._tileSize;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.beginPath();
    this.ctx.moveTo(px, py - 3);
    this.ctx.lineTo(px - 2, py + 2);
    this.ctx.lineTo(px + 2, py + 2);
    this.ctx.closePath();
    this.ctx.fill();
  }

  dispose(): void {
    // Nothing to dispose for canvas
  }
}

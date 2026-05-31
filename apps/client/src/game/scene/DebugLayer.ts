import { TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import {
  BoxGeometry,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  type Vector3,
} from "three";
import type { Scene } from "three";

export interface DebugLayerOptions {
  readonly scene: Scene;
}

interface DebugTile {
  readonly tile: TileCoord;
  readonly mesh: Mesh;
  readonly type: "trueTile" | "path" | "collision" | "footprint" | "reach" | "loS";
}

export type DebugPrimitive =
  | "trueTile"
  | "path"
  | "collision"
  | "footprint"
  | "loS"
  | "reach"
  | "actionQueue"
  | "combatCooldown"
  | "npcLeash"
  | "varbits";

/**
 * Debug layer: true tile markers, path lines, collision indicators.
 * Togglable and lightweight.
 */
export class DebugLayer {
  private readonly scene: Scene;
  private readonly tiles = new Map<string, DebugTile>();
  private readonly group = new Group();
  private readonly tileGeometry = new BoxGeometry(0.95, 0.05, 0.95);
  private readonly trueTileMaterial = new MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5,
  });
  private readonly pathMaterial = new MeshBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: 0.3,
  });
  private readonly collisionMaterial = new MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.4,
  });
  private readonly footprintMaterial = new MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.3,
  });
  private readonly reachMaterial = new MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.3,
  });
  private readonly loSLineMaterial = new LineBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.7,
  });
  private _visible = false;
  private _showTrueTile = true;
  private _showPath = true;
  private _showCollision = false;
  private _showFootprint = false;
  private _showLoS = false;
  private _showReach = false;
  private _showActionQueue = false;
  private _showCombatCooldown = false;
  private _showNpcLeash = false;
  private _showVarbits = false;
  private _pendingHits = new Map<string, number>();
  private _actionQueue: string[] = [];
  private _combatCooldown = 0;
  private _npcLeash: TileCoord | undefined;
  private _varbits = new Map<string, number>();

  constructor(options: DebugLayerOptions) {
    this.scene = options.scene;
    this.group.name = "debug";
    this.scene.add(this.group);
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
    this.group.visible = value;
  }

  toggle(): void {
    this.visible = !this.visible;
  }

  markTrueTile(tile: TileCoord, entityId: number): void {
    const key = `true:${entityId}`;
    this._removeTile(key);
    if (!this._showTrueTile) return;
    const mesh = new Mesh(this.tileGeometry, this.trueTileMaterial);
    mesh.position.set(tile.x * TILE_SIZE_WORLD_UNITS, 0.05, -tile.y * TILE_SIZE_WORLD_UNITS);
    this.group.add(mesh);
    this.tiles.set(key, { tile, mesh, type: "trueTile" });
  }

  markPathTile(tile: TileCoord): void {
    const key = `path:${tile.x}:${tile.y}:${tile.plane}`;
    if (this.tiles.has(key)) return;
    if (!this._showPath) return;
    const mesh = new Mesh(this.tileGeometry, this.pathMaterial);
    mesh.position.set(tile.x * TILE_SIZE_WORLD_UNITS, 0.05, -tile.y * TILE_SIZE_WORLD_UNITS);
    this.group.add(mesh);
    this.tiles.set(key, { tile, mesh, type: "path" });
  }

  markCollisionTile(tile: TileCoord): void {
    const key = `collision:${tile.x}:${tile.y}:${tile.plane}`;
    if (this.tiles.has(key)) return;
    if (!this._showCollision) return;
    const mesh = new Mesh(this.tileGeometry, this.collisionMaterial);
    mesh.position.set(tile.x * TILE_SIZE_WORLD_UNITS, 0.05, -tile.y * TILE_SIZE_WORLD_UNITS);
    this.group.add(mesh);
    this.tiles.set(key, { tile, mesh, type: "collision" });
  }

  markFootprint(tile: TileCoord): void {
    const key = `footprint:${tile.x}:${tile.y}:${tile.plane}`;
    if (this.tiles.has(key)) return;
    if (!this._showFootprint) return;
    const mesh = new Mesh(this.tileGeometry, this.footprintMaterial);
    mesh.position.set(tile.x * TILE_SIZE_WORLD_UNITS, 0.05, -tile.y * TILE_SIZE_WORLD_UNITS);
    this.group.add(mesh);
    this.tiles.set(key, { tile, mesh, type: "footprint" });
  }

  markReachTiles(center: TileCoord, radius: number): void {
    const existing = new Set<string>();
    for (const key of this.tiles.keys()) {
      if (key.startsWith("reach:")) existing.add(key);
    }
    for (const key of existing) {
      this._removeTile(key);
    }
    if (!this._showReach) return;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tile = { x: center.x + dx, y: center.y + dy, plane: center.plane };
        const key = `reach:${tile.x}:${tile.y}:${tile.plane}`;
        const mesh = new Mesh(this.tileGeometry, this.reachMaterial);
        mesh.position.set(tile.x * TILE_SIZE_WORLD_UNITS, 0.05, -tile.y * TILE_SIZE_WORLD_UNITS);
        this.group.add(mesh);
        this.tiles.set(key, { tile, mesh, type: "reach" });
      }
    }
  }

  markLoSRay(start: Vector3, end: Vector3): void {
    const key = "los:ray";
    for (const k of this.tiles.keys()) {
      if (k.startsWith("los:")) {
        const tile = this.tiles.get(k);
        if (tile) this._removeTile(k);
      }
    }
    if (!this._showLoS) return;
    const geometry = new BufferGeometry().setFromPoints([start, end]);
    const line = new Line(geometry, this.loSLineMaterial);
    this.group.add(line);
    this.tiles.set(key, {
      tile: { x: 0, y: 0, plane: 0 },
      mesh: line as unknown as Mesh,
      type: "loS",
    });
  }

  getActionQueue(): string[] {
    return this._actionQueue;
  }

  setActionQueue(actions: string[]): void {
    this._actionQueue = actions;
  }

  getCombatCooldown(): number {
    return this._combatCooldown;
  }

  setCombatCooldown(tick: number): void {
    this._combatCooldown = tick;
  }

  getPendingHits(): Map<string, number> {
    return this._pendingHits;
  }

  setPendingHits(hits: Map<string, number>): void {
    this._pendingHits = hits;
  }

  getNpcLeash(): TileCoord | undefined {
    return this._npcLeash;
  }

  setNpcLeash(tile: TileCoord | undefined): void {
    this._npcLeash = tile;
  }

  getVarbits(): Map<string, number> {
    return this._varbits;
  }

  setVarbits(varbits: Map<string, number>): void {
    this._varbits = varbits;
  }

  setShowPrimitive(primitive: DebugPrimitive, value: boolean): void {
    switch (primitive) {
      case "trueTile":
        this._showTrueTile = value;
        break;
      case "path":
        this._showPath = value;
        break;
      case "collision":
        this._showCollision = value;
        break;
      case "footprint":
        this._showFootprint = value;
        break;
      case "loS":
        this._showLoS = value;
        break;
      case "reach":
        this._showReach = value;
        break;
      case "actionQueue":
        this._showActionQueue = value;
        break;
      case "combatCooldown":
        this._showCombatCooldown = value;
        break;
      case "npcLeash":
        this._showNpcLeash = value;
        break;
      case "varbits":
        this._showVarbits = value;
        break;
    }
  }

  getShowPrimitive(primitive: DebugPrimitive): boolean {
    switch (primitive) {
      case "trueTile":
        return this._showTrueTile;
      case "path":
        return this._showPath;
      case "collision":
        return this._showCollision;
      case "footprint":
        return this._showFootprint;
      case "loS":
        return this._showLoS;
      case "reach":
        return this._showReach;
      case "actionQueue":
        return this._showActionQueue;
      case "combatCooldown":
        return this._showCombatCooldown;
      case "npcLeash":
        return this._showNpcLeash;
      case "varbits":
        return this._showVarbits;
    }
  }

  clear(): void {
    for (const key of this.tiles.keys()) {
      this._removeTile(key);
    }
  }

  dispose(): void {
    this.clear();
    this.group.clear();
    this.scene.remove(this.group);
    this.tileGeometry.dispose();
    this.trueTileMaterial.dispose();
    this.pathMaterial.dispose();
    this.collisionMaterial.dispose();
    this.footprintMaterial.dispose();
    this.reachMaterial.dispose();
    this.loSLineMaterial.dispose();
  }

  private _removeTile(key: string): void {
    const debugTile = this.tiles.get(key);
    if (!debugTile) return;
    this.group.remove(debugTile.mesh);
    debugTile.mesh.geometry.dispose();
    this.tiles.delete(key);
  }

  drawLine(start: Vector3, end: Vector3, color = 0xffff00): Line {
    const material = new LineBasicMaterial({ color });
    const geometry = new BufferGeometry().setFromPoints([start, end]);
    const line = new Line(geometry, material);
    this.group.add(line);
    return line;
  }
}

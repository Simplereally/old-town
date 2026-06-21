import type { ChunkData, RegionTileData } from "@old-town/shared";
import type { Group, InstancedMesh, Scene } from "three";
import {
  DoubleSide,
  InstancedMesh as ThreeInstancedMesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  BoxGeometry as ThreeBoxGeometry,
  Group as ThreeGroup,
  Object3D,
} from "three";
import { MaterialColorResolver } from "../renderer/MaterialColorResolver";

/** Height unit in world space: 1 height unit = 0.5 world units (POC_SPEC §5.1). */
const HEIGHT_SCALE = 0.5;
/** Water surface render level (below ground). */
const WATER_LEVEL = -0.25;
/** Bridge walkway height above water. */
const BRIDGE_OFFSET = 0.35;

export interface TerrainLayerOptions {
  readonly scene: Scene;
  /** Material color resolver (from E42-S01 registry). Falls back to default green. */
  readonly colorResolver?: MaterialColorResolver;
}

interface ChunkMesh {
  readonly group: Group;
  readonly regionId: string;
  readonly cx: number;
  readonly cy: number;
}

/**
 * Terrain layer: renders tiles from server chunk data with material grouping.
 * Chunks are loaded/unloaded dynamically as regions enter/leave the player's interest area.
 *
 * Two paths are supported:
 * 1. Raw chunk data — InstancedMesh per material per chunk (debug / fallback path).
 * 2. Baked chunk upload — a pre-built Group from ChunkUploadQueue (production path).
 */
export class TerrainLayer {
  private readonly scene: Scene;
  private readonly chunks = new Map<string, ChunkMesh>();
  private readonly bakedChunks = new Map<string, Group>();
  private readonly tileGeometry = new PlaneGeometry(1, 1);
  private readonly waterGeometry = new PlaneGeometry(1, 1);
  private readonly cliffGeometry = new ThreeBoxGeometry(1, 1, 0.05);
  private readonly bridgeGeometry = new ThreeBoxGeometry(0.9, 0.1, 0.9);
  private colorResolver: MaterialColorResolver;
  private readonly materialCache = new Map<string, MeshLambertMaterial>();
  private readonly cliffMaterial = new MeshLambertMaterial({
    color: 0x4a4a4a,
    flatShading: true,
    side: DoubleSide,
  });
  private readonly waterMaterial = new MeshBasicMaterial({
    color: 0x4a90d9,
    side: DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  private readonly _dummy = new Object3D();

  constructor(options: TerrainLayerOptions) {
    this.scene = options.scene;
    this.colorResolver = options.colorResolver ?? new MaterialColorResolver({});
  }

  /** Update the color resolver after content registries are loaded. */
  setColorResolver(resolver: MaterialColorResolver): void {
    this.colorResolver = resolver;
    // Clear material cache so materials are recreated with correct colors.
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();
  }

  /** Load a chunk into the scene from raw server data (debug / fallback path). */
  loadChunk(regionId: string, chunk: ChunkData): void {
    const cx = chunk.cx;
    const cy = chunk.cy;
    const key = `${regionId}:${cx}:${cy}`;
    if (this.chunks.has(key) || this.bakedChunks.has(key)) {
      this.unloadChunk(key);
    }

    const group = new ThreeGroup();
    group.name = `chunk_${key}`;

    // Build a tile lookup map for cliff-face detection.
    const tileLookup = new Map<string, RegionTileData>();
    for (const tile of chunk.tiles) {
      tileLookup.set(`${tile.x}:${tile.y}`, tile);
    }

    // Group tiles by material ID for InstancedMesh batching.
    const underlayBuckets = new Map<string, { x: number; y: number; height: number }[]>();
    const overlayBuckets = new Map<string, { x: number; y: number; height: number }[]>();
    const waterTiles: { x: number; y: number; height: number }[] = [];
    const bridgeTiles: { x: number; y: number; height: number; materialId: string }[] = [];
    const cliffFaces: { x: number; y: number; height: number; side: number }[] = [];

    for (const tile of chunk.tiles) {
      const height = tile.height ?? 0;
      if (tile.bridge) {
        const underlayId = tile.underlayId ?? "wood_floor";
        bridgeTiles.push({ x: tile.x, y: tile.y, height, materialId: underlayId });
        continue;
      }
      if (tile.water) {
        waterTiles.push({ x: tile.x, y: tile.y, height });
        continue;
      }
      const underlayId = tile.underlayId ?? "grass";
      const underlay = underlayBuckets.get(underlayId) ?? [];
      underlay.push({ x: tile.x, y: tile.y, height });
      underlayBuckets.set(underlayId, underlay);

      if (tile.overlayId !== undefined) {
        const overlay = overlayBuckets.get(tile.overlayId) ?? [];
        overlay.push({ x: tile.x, y: tile.y, height });
        overlayBuckets.set(tile.overlayId, overlay);
      }

      // Detect cliff faces: check 4 neighbors for height differences.
      this.collectCliffFaces(tile, tileLookup, cliffFaces);
    }

    // Create one InstancedMesh per underlay material.
    for (const [materialId, tiles] of underlayBuckets) {
      const mesh = this.createInstancedMesh(materialId, tiles, 0);
      group.add(mesh);
    }

    // Create one InstancedMesh per overlay material (slightly above underlay).
    for (const [materialId, tiles] of overlayBuckets) {
      const mesh = this.createInstancedMesh(materialId, tiles, 0.02);
      group.add(mesh);
    }

    // Water tiles as a single InstancedMesh at WATER_LEVEL.
    if (waterTiles.length > 0) {
      const mesh = new ThreeInstancedMesh(
        this.waterGeometry,
        this.waterMaterial,
        waterTiles.length,
      );
      for (let i = 0; i < waterTiles.length; i++) {
        const t = waterTiles[i]!;
        this._dummy.rotation.set(-Math.PI / 2, 0, 0);
        this._dummy.position.set(t.x, WATER_LEVEL, t.y);
        this._dummy.updateMatrix();
        mesh.setMatrixAt(i, this._dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    // Bridge tiles as raised walkways above water.
    for (const bt of bridgeTiles) {
      const material = this.getMaterial(bt.materialId);
      const mesh = new ThreeInstancedMesh(this.bridgeGeometry, material, 1);
      this._dummy.rotation.set(0, 0, 0);
      this._dummy.position.set(bt.x, WATER_LEVEL + BRIDGE_OFFSET, bt.y);
      this._dummy.updateMatrix();
      mesh.setMatrixAt(0, this._dummy.matrix);
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    // Cliff faces for height differences.
    if (cliffFaces.length > 0) {
      const mesh = new ThreeInstancedMesh(
        this.cliffGeometry,
        this.cliffMaterial,
        cliffFaces.length,
      );
      for (let i = 0; i < cliffFaces.length; i++) {
        const c = cliffFaces[i]!;
        const cliffHeight = c.height * HEIGHT_SCALE;
        this._dummy.rotation.set(0, c.side, 0);
        this._dummy.position.set(c.x, cliffHeight / 2, c.y);
        this._dummy.scale.set(1, cliffHeight, 1);
        this._dummy.updateMatrix();
        mesh.setMatrixAt(i, this._dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    this.scene.add(group);
    this.chunks.set(key, { group, regionId, cx, cy });
  }

  private createInstancedMesh(
    materialId: string,
    tiles: { x: number; y: number; height: number }[],
    yOffset: number,
  ): InstancedMesh {
    const material = this.getMaterial(materialId);
    const mesh = new ThreeInstancedMesh(
      this.tileGeometry,
      material,
      tiles.length,
    );
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i]!;
      this._dummy.rotation.set(-Math.PI / 2, 0, 0);
      this._dummy.position.set(t.x, t.height * HEIGHT_SCALE + yOffset, t.y);
      this._dummy.updateMatrix();
      mesh.setMatrixAt(i, this._dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  /** Add a pre-built baked chunk Group to the scene (production path). */
  addBakedChunk(key: string, group: Group): void {
    const existing = this.bakedChunks.get(key);
    if (existing === group) {
      if (group.parent !== this.scene) {
        this.scene.add(group);
      }
      return;
    }
    if (this.chunks.has(key) || this.bakedChunks.has(key)) {
      this.unloadChunk(key);
    }
    this.scene.add(group);
    this.bakedChunks.set(key, group);
  }

  /** Unload a chunk by its key (works for both raw and baked paths). */
  unloadChunk(key: string): void {
    const raw = this.chunks.get(key);
    if (raw) {
      const group = raw.group;
      this.scene.remove(group);
      group.clear();
      this.chunks.delete(key);
      return;
    }

    const baked = this.bakedChunks.get(key);
    if (baked) {
      this.scene.remove(baked);
      this.bakedChunks.delete(key);
      // Geometry/material disposal is handled by ChunkUploadQueue.evictChunk
    }
  }

  /** Unload all chunks for a given region. */
  unloadRegion(regionId: string): void {
    for (const [key, chunk] of this.chunks) {
      if (chunk.regionId === regionId) {
        this.unloadChunk(key);
      }
    }
    for (const [key, _group] of this.bakedChunks) {
      // Baked chunk keys are `${regionId}:${cx}:${cy}`; parse region prefix
      if (key.startsWith(`${regionId}:`)) {
        this.unloadChunk(key);
      }
    }
  }

  /** Unload all chunks. */
  clear(): void {
    for (const key of Array.from(this.chunks.keys())) {
      this.unloadChunk(key);
    }
    for (const key of Array.from(this.bakedChunks.keys())) {
      this.unloadChunk(key);
    }
  }

  private getMaterial(materialId: string): MeshLambertMaterial {
    const existing = this.materialCache.get(materialId);
    if (existing) {
      return existing;
    }
    const mat = new MeshLambertMaterial({
      color: this.colorResolver.resolve(materialId),
      flatShading: true,
      side: DoubleSide,
    });
    this.materialCache.set(materialId, mat);
    return mat;
  }

  /** Detect cliff faces where tile height exceeds a neighbor's height. */
  private collectCliffFaces(
    tile: RegionTileData,
    lookup: Map<string, RegionTileData>,
    out: { x: number; y: number; height: number; side: number }[],
  ): void {
    const height = tile.height ?? 0;
    if (height <= 0) return;
    const neighbors: Array<{ dx: number; dy: number; side: number }> = [
      { dx: 0, dy: 1, side: 0 }, // north
      { dx: 1, dy: 0, side: Math.PI / 2 }, // east
      { dx: 0, dy: -1, side: Math.PI }, // south
      { dx: -1, dy: 0, side: -Math.PI / 2 }, // west
    ];
    for (const n of neighbors) {
      const neighbor = lookup.get(`${tile.x + n.dx}:${tile.y + n.dy}`);
      if (!neighbor) continue;
      const neighborHeight = neighbor.height ?? 0;
      if (height > neighborHeight) {
        out.push({ x: tile.x, y: tile.y, height: height - neighborHeight, side: n.side });
      }
    }
  }

  /** Number of currently loaded raw chunks. */
  get rawChunkCount(): number {
    return this.chunks.size;
  }

  /** Number of currently loaded baked chunks. */
  get bakedChunkCount(): number {
    return this.bakedChunks.size;
  }

  /** Total loaded chunks (raw + baked). */
  get loadedChunkCount(): number {
    return this.chunks.size + this.bakedChunks.size;
  }

  dispose(): void {
    this.clear();
    this.tileGeometry.dispose();
    this.waterGeometry.dispose();
    this.cliffGeometry.dispose();
    this.bridgeGeometry.dispose();
    this.waterMaterial.dispose();
    this.cliffMaterial.dispose();
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();
  }
}

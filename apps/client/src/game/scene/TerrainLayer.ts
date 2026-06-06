import type { ChunkData } from "@old-town/shared";
import type { Group, Scene } from "three";
import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Group as ThreeGroup,
} from "three";

function materialIdToColor(id: string): number {
  const palette: Record<string, number | undefined> = {
    grass: 0x4a8c4a,
    dirt: 0x8b7355,
    stone: 0x7a7a7a,
    water: 0x4a90d9,
    floor: 0x8b6f47,
    sand: 0xc2b280,
    forest: 0x2d5a27,
    mud: 0x5c4033,
    cobble: 0x696969,
    path: 0xa08060,
    default: 0x4a8c4a,
  };
  return palette[id] ?? palette.default ?? 0x4a8c4a;
}

export interface TerrainLayerOptions {
  readonly scene: Scene;
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
 * 1. Raw chunk data — one mesh per tile (legacy / debug path).
 * 2. Baked chunk upload — a pre-built Group from ChunkUploadQueue (production path).
 */
export class TerrainLayer {
  private readonly scene: Scene;
  private readonly chunks = new Map<string, ChunkMesh>();
  private readonly bakedChunks = new Map<string, Group>();
  private readonly chunkGeometry = new BoxGeometry(1, 0.2, 1);
  private readonly waterGeometry = new PlaneGeometry(1, 1);
  private readonly materialCache = new Map<string, MeshLambertMaterial>();
  private readonly waterMaterial = new MeshBasicMaterial({
    color: 0x4a90d9,
    side: DoubleSide,
    transparent: true,
    opacity: 0.7,
  });

  constructor(options: TerrainLayerOptions) {
    this.scene = options.scene;
  }

  /** Load a chunk into the scene from raw server data (legacy path). */
  loadChunk(regionId: string, chunk: ChunkData): void {
    const cx = chunk.cx;
    const cy = chunk.cy;
    const key = `${regionId}:${cx}:${cy}`;
    if (this.chunks.has(key) || this.bakedChunks.has(key)) {
      this.unloadChunk(key);
    }

    const group = new ThreeGroup();
    group.name = `chunk_${key}`;

    for (const tile of chunk.tiles) {
      const mesh = this.createTileMesh(tile);
      group.add(mesh);
    }

    this.scene.add(group);
    this.chunks.set(key, { group, regionId, cx, cy });
  }

  /** Add a pre-built baked chunk Group to the scene (production path). */
  addBakedChunk(key: string, group: Group): void {
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
    for (const [key, group] of this.bakedChunks) {
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

  /** Create a single tile mesh from server tile data. */
  private createTileMesh(tile: ChunkData["tiles"][number]): Mesh {
    const isWater = tile.water ?? false;
    const height = tile.height ?? 0;
    const underlayId = tile.underlayId ?? "grass";

    if (isWater) {
      const mesh = new Mesh(this.waterGeometry, this.waterMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(tile.x, 0.05, -tile.y);
      return mesh;
    }

    const mesh = new Mesh(this.chunkGeometry, this.getMaterial(underlayId));
    mesh.position.set(tile.x, height * 0.1, -tile.y);
    return mesh;
  }

  private getMaterial(materialId: string): MeshLambertMaterial {
    const existing = this.materialCache.get(materialId);
    if (existing) {
      return existing;
    }
    const mat = new MeshLambertMaterial({
      color: materialIdToColor(materialId),
      flatShading: true,
    });
    this.materialCache.set(materialId, mat);
    return mat;
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
    this.chunkGeometry.dispose();
    this.waterGeometry.dispose();
    this.waterMaterial.dispose();
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();
  }
}

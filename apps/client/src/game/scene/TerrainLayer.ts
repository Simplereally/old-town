import type { ChunkData } from "@old-town/shared";
import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
} from "three";
import type { Scene } from "three";

/** Simple material cache for terrain tiles by underlay ID. */
const materialCache = new Map<string, MeshLambertMaterial>();

/** Shared water material to avoid creating identical materials per tile. */
const waterMaterial = new MeshBasicMaterial({
  color: 0x4a90d9,
  side: DoubleSide,
  transparent: true,
  opacity: 0.7,
});

function getMaterial(materialId: string): MeshLambertMaterial {
  if (!materialCache.has(materialId)) {
    const color = materialIdToColor(materialId);
    const mat = new MeshLambertMaterial({ color });
    materialCache.set(materialId, mat);
  }
  const cached = materialCache.get(materialId);
  if (cached === undefined) {
    throw new Error(`Material ${materialId} not found in cache after insertion`);
  }
  return cached;
}

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
 */
export class TerrainLayer {
  private readonly scene: Scene;
  private readonly chunks = new Map<string, ChunkMesh>();
  private readonly chunkGeometry = new BoxGeometry(1, 0.2, 1);
  private readonly waterGeometry = new PlaneGeometry(1, 1);

  constructor(options: TerrainLayerOptions) {
    this.scene = options.scene;
  }

  /** Load a chunk into the scene. */
  loadChunk(regionId: string, chunk: ChunkData): void {
    const cx = chunk.cx;
    const cy = chunk.cy;
    const key = `${regionId}:${cx}:${cy}`;
    if (this.chunks.has(key)) {
      this.unloadChunk(key);
    }

    const group = new Group();
    group.name = `chunk_${key}`;

    for (const tile of chunk.tiles) {
      const mesh = this.createTileMesh(tile);
      group.add(mesh);
    }

    this.scene.add(group);
    this.chunks.set(key, { group, regionId, cx, cy });
  }

  /** Unload a chunk by its key. */
  unloadChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    const group = chunk.group;
    this.scene.remove(group);
    for (const child of group.children) {
      if (child instanceof Mesh) {
        child.geometry.dispose();
      }
    }
    this.chunks.delete(key);
  }

  /** Unload all chunks for a given region. */
  unloadRegion(regionId: string): void {
    for (const [key, chunk] of this.chunks) {
      if (chunk.regionId === regionId) {
        this.unloadChunk(key);
      }
    }
  }

  /** Unload all chunks. */
  clear(): void {
    for (const key of this.chunks.keys()) {
      this.unloadChunk(key);
    }
  }

  /** Create a single tile mesh from server tile data. */
  private createTileMesh(tile: ChunkData["tiles"][number]): Mesh {
    const isWater = tile.water ?? false;
    const height = tile.height ?? 0;
    const underlayId = tile.underlayId ?? "grass";

    if (isWater) {
      const mesh = new Mesh(this.waterGeometry, waterMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(tile.x, 0.05, -tile.y);
      return mesh;
    }

    const mesh = new Mesh(this.chunkGeometry, getMaterial(underlayId));
    mesh.position.set(tile.x, height * 0.1, -tile.y);
    return mesh;
  }

  /** Number of currently loaded chunks. */
  get loadedChunkCount(): number {
    return this.chunks.size;
  }

  dispose(): void {
    this.clear();
  }
}

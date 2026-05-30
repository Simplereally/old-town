/**
 * Integer coordinate primitives and the tile → chunk → region hierarchy.
 * All gameplay truth uses these; raw `{ x, y }` objects must not stand in for a
 * {@link TileCoord} where tile truth is required (see POC_SPEC.md §2.2, §4).
 */
import { CHUNKS_PER_REGION, CHUNK_SIZE, REGION_SIZE } from "../constants";
import type { ChunkId, RegionId } from "./ids";

/** Vertical plane index, 0..3. */
export type Plane = 0 | 1 | 2 | 3;

/** Global integer tile position. */
export interface TileCoord {
  readonly x: number;
  readonly y: number;
  readonly plane: Plane;
}

/** Chunk coordinate: `c = floor(tile / CHUNK_SIZE)`. */
export interface ChunkCoord {
  readonly cx: number;
  readonly cy: number;
  readonly plane: Plane;
}

/** Region coordinate: `r = floor(tile / REGION_SIZE)`. */
export interface RegionCoord {
  readonly rx: number;
  readonly ry: number;
  readonly plane: Plane;
}

/** Local position within the active 104×104 scene (0..103). */
export interface LocalSceneCoord {
  readonly sx: number;
  readonly sy: number;
  readonly plane: Plane;
}

/** Narrow a number to a {@link Plane}. */
export function isPlane(value: number): value is Plane {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/** Convert a tile to its containing chunk. Uses floor division (handles negatives). */
export function tileToChunk(tile: TileCoord): ChunkCoord {
  return {
    cx: Math.floor(tile.x / CHUNK_SIZE),
    cy: Math.floor(tile.y / CHUNK_SIZE),
    plane: tile.plane,
  };
}

/** Convert a tile to its containing region. Uses floor division (handles negatives). */
export function tileToRegion(tile: TileCoord): RegionCoord {
  return {
    rx: Math.floor(tile.x / REGION_SIZE),
    ry: Math.floor(tile.y / REGION_SIZE),
    plane: tile.plane,
  };
}

/** Convert a chunk to its containing region. */
export function chunkToRegion(chunk: ChunkCoord): RegionCoord {
  return {
    rx: Math.floor(chunk.cx / CHUNKS_PER_REGION),
    ry: Math.floor(chunk.cy / CHUNKS_PER_REGION),
    plane: chunk.plane,
  };
}

/** Stable string key for a tile: `${x}:${y}:${plane}`. */
export function tileKey(tile: TileCoord): string {
  return `${tile.x}:${tile.y}:${tile.plane}`;
}

/** Stable {@link ChunkId} key: `${cx}:${cy}:${plane}`. */
export function chunkId(chunk: ChunkCoord): ChunkId {
  return `${chunk.cx}:${chunk.cy}:${chunk.plane}` as ChunkId;
}

/** Stable {@link RegionId} key: `${rx}:${ry}:${plane}`. */
export function regionId(region: RegionCoord): RegionId {
  return `${region.rx}:${region.ry}:${region.plane}` as RegionId;
}

// --- Optional packed numeric key (fast path) --------------------------------------
// Mirrors POC_SPEC.md §4.2: packedTile = (plane << 28) | (x << 14) | y.
// 14 bits per axis ⇒ 0..16383. This is an optional optimization; string keys remain
// the canonical key form and support negative/large coordinates.

/** Bits reserved per tile axis in the packed representation. */
export const PACKED_TILE_AXIS_BITS = 14;

/** Maximum tile coordinate per axis that {@link packTile} supports (16383). */
export const PACKED_TILE_AXIS_MAX = (1 << PACKED_TILE_AXIS_BITS) - 1;

/**
 * Pack a tile into a single 32-bit-safe integer. Requires `0 <= x,y <= 16383`.
 * Use string {@link tileKey} for coordinates outside that range.
 */
export function packTile(tile: TileCoord): number {
  if (tile.x < 0 || tile.y < 0 || tile.x > PACKED_TILE_AXIS_MAX || tile.y > PACKED_TILE_AXIS_MAX) {
    throw new RangeError(
      `packTile requires 0 <= x,y <= ${PACKED_TILE_AXIS_MAX}, received (${tile.x}, ${tile.y})`,
    );
  }
  return (tile.plane << 28) | (tile.x << PACKED_TILE_AXIS_BITS) | tile.y;
}

/** Inverse of {@link packTile}. */
export function unpackTile(packed: number): TileCoord {
  const plane = (packed >>> 28) & 0x3;
  const x = (packed >>> PACKED_TILE_AXIS_BITS) & PACKED_TILE_AXIS_MAX;
  const y = packed & PACKED_TILE_AXIS_MAX;
  return { x, y, plane: plane as Plane };
}

/**
 * Resolve the local player's current audio zone from loaded region chunk tiles.
 * Zone identity is authoritative server data stamped onto RegionTileData (E47-S01).
 */
import { CHUNK_SIZE, type ChunkData, type TileCoord } from "@old-town/shared";

export function chunkKeyForTile(tile: Pick<TileCoord, "x" | "y" | "plane">): string {
  const cx = Math.floor(tile.x / CHUNK_SIZE);
  const cy = Math.floor(tile.y / CHUNK_SIZE);
  return `${cx}:${cy}:${tile.plane}`;
}

/**
 * Look up `zoneId` for an integer world tile from loaded chunk payloads.
 * Returns `undefined` when the tile is unloaded or has no zone paint.
 */
export function resolveZoneIdAtTile(
  loadedChunks: ReadonlyMap<string, ChunkData>,
  tile: Pick<TileCoord, "x" | "y" | "plane">,
): string | undefined {
  const chunk = loadedChunks.get(chunkKeyForTile(tile));
  if (!chunk) return undefined;
  for (const entry of chunk.tiles) {
    if (entry.x === tile.x && entry.y === tile.y) {
      return entry.zoneId;
    }
  }
  return undefined;
}

import type { RegionTileData } from "@old-town/shared";
import type {
  BakeChunkFailure,
  BakeChunkRequest,
  BakeChunkSuccess,
  BakedChunkPayload,
  CancelBakeChunk,
  ChunkBounds,
  CollisionDebugData,
  MaterialGroup,
  ObjectInstanceDescriptor,
  ObjectRef,
  TileMetadata,
} from "./ChunkBakeWorkerClient";

export function buildBakedChunkPayload(
  chunkCoord: { cx: number; cy: number; plane: number },
  tiles: readonly RegionTileData[],
  objectRefs: readonly ObjectRef[],
): BakedChunkPayload {
  const vertexCount = Math.max(1, tiles.length * 4);
  const indexCount = Math.max(1, tiles.length * 6);

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(indexCount);

  let v = 0;
  let iIdx = 0;

  for (const tile of tiles) {
    const baseX = tile.x;
    const baseY = tile.y;
    const h = tile.height;

    const quad: [number, number, number][] = [
      [baseX, h, baseY],
      [baseX + 1, h, baseY],
      [baseX + 1, h, baseY + 1],
      [baseX, h, baseY + 1],
    ];

    for (let j = 0; j < 4; j++) {
      const q = quad[j];
      if (!q) continue;
      positions[v * 3 + 0] = q[0];
      positions[v * 3 + 1] = q[1];
      positions[v * 3 + 2] = q[2];

      normals[v * 3 + 0] = 0;
      normals[v * 3 + 1] = 1;
      normals[v * 3 + 2] = 0;

      colors[v * 3 + 0] = 0.5;
      colors[v * 3 + 1] = 0.6;
      colors[v * 3 + 2] = 0.4;

      v++;
    }

    indices[iIdx + 0] = v - 4;
    indices[iIdx + 1] = v - 3;
    indices[iIdx + 2] = v - 2;
    indices[iIdx + 3] = v - 4;
    indices[iIdx + 4] = v - 2;
    indices[iIdx + 5] = v - 1;

    iIdx += 6;
  }

  const materialGroups: MaterialGroup[] = [];
  if (tiles.length > 0) {
    materialGroups.push({ startIndex: 0, count: indexCount, materialId: "terrain_default" });
  } else {
    materialGroups.push({ startIndex: 0, count: 1, materialId: "terrain_default" });
  }

  const bounds: ChunkBounds = {
    minX: chunkCoord.cx * 8,
    minY: chunkCoord.cy * 8,
    minZ: 0,
    maxX: chunkCoord.cx * 8 + 8,
    maxY: chunkCoord.cy * 8 + 8,
    maxZ: 0,
  };

  const tileMetadata: TileMetadata[] = tiles.map((t) => ({
    x: t.x,
    y: t.y,
    height: t.height,
    underlayId: t.underlayId,
    overlayId: t.overlayId ?? null,
    collision: t.collision,
  }));

  const collisionDebugData: CollisionDebugData[] = tiles.map((t) => ({
    x: t.x,
    y: t.y,
    flags: t.collision,
  }));

  const objectInstanceDescriptors: ObjectInstanceDescriptor[] = objectRefs.map((o) => ({
    objectId: o.objectId,
    x: o.x,
    y: o.y,
    z: o.z,
    rotation: o.rotation,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  }));

  return {
    positions,
    normals,
    colors,
    indices,
    materialGroups,
    bounds,
    tileMetadata,
    collisionDebugData,
    objectInstanceDescriptors,
  };
}

const cancelled = new Set<string>();

const workerCtx = globalThis as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (data: unknown, transfer?: Transferable[]) => void;
};

workerCtx.onmessage = (event: MessageEvent) => {
  const msg = event.data as BakeChunkRequest | CancelBakeChunk;

  if (msg.type === "cancel_bake_chunk") {
    cancelled.add(msg.jobId);
    return;
  }

  if (msg.type === "bake_chunk") {
    const { jobId, regionId, chunkCoord, tiles, objectRefs } = msg;

    try {
      if (cancelled.has(jobId)) {
        cancelled.delete(jobId);
        const failure: BakeChunkFailure = {
          type: "bake_chunk_failure",
          jobId,
          regionId,
          chunkCoord,
          errorCode: "cancelled",
          message: "Job was cancelled before completion",
        };
        workerCtx.postMessage(failure);
        return;
      }

      const payload = buildBakedChunkPayload(chunkCoord, tiles, objectRefs);

      const transferables: ArrayBuffer[] = [
        payload.positions.buffer as ArrayBuffer,
        payload.normals.buffer as ArrayBuffer,
        payload.colors.buffer as ArrayBuffer,
        payload.indices.buffer as ArrayBuffer,
      ];

      const success: BakeChunkSuccess = {
        type: "bake_chunk_success",
        jobId,
        regionId,
        chunkCoord,
        payload,
        transferables,
      };

      workerCtx.postMessage(success, transferables);
    } catch (err) {
      const failure: BakeChunkFailure = {
        type: "bake_chunk_failure",
        jobId,
        regionId,
        chunkCoord,
        errorCode: "bake_error",
        message: err instanceof Error ? err.message : String(err),
      };
      workerCtx.postMessage(failure);
    }
  }
};

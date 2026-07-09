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
  materialColors?: Record<string, number>,
): BakedChunkPayload {
  const DEFAULT_COLOR = 0x4f8f3a;
  const resolveColor = (id: string): number => materialColors?.[id] ?? DEFAULT_COLOR;

  // Each tile produces up to 2 quads: underlay + optional overlay.
  const maxQuads = tiles.length * 2;
  const vertexCount = Math.max(1, maxQuads * 4);
  const indexCount = Math.max(1, maxQuads * 6);

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(indexCount);

  // Group quads by material ID so we can build MaterialGroup[] draw ranges.
  const materialQuadRanges: MaterialGroup[] = [];
  const quadMaterialIds: string[] = []; // materialId per quad, parallel to quad index
  const quadIndexRanges: { startVertex: number; startIndex: number }[] = [];

  let v = 0;
  let iIdx = 0;
  let quadCount = 0;

  function hexToRgb(hex: number): [number, number, number] {
    return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
  }

  function writeQuad(
    baseX: number,
    baseY: number,
    h: number,
    color: number,
    materialId: string,
  ): void {
    const [r, g, b] = hexToRgb(color);
    const quad: [number, number, number][] = [
      [baseX, h, baseY],
      [baseX + 1, h, baseY],
      [baseX + 1, h, baseY + 1],
      [baseX, h, baseY + 1],
    ];

    const startVertex = v;
    for (let j = 0; j < 4; j++) {
      const q = quad[j];
      if (!q) continue;
      positions[v * 3 + 0] = q[0];
      positions[v * 3 + 1] = q[1];
      positions[v * 3 + 2] = q[2];

      normals[v * 3 + 0] = 0;
      normals[v * 3 + 1] = 1;
      normals[v * 3 + 2] = 0;

      colors[v * 3 + 0] = r;
      colors[v * 3 + 1] = g;
      colors[v * 3 + 2] = b;

      v++;
    }

    const startIndex = iIdx;
    indices[iIdx + 0] = startVertex;
    indices[iIdx + 1] = startVertex + 2;
    indices[iIdx + 2] = startVertex + 1;
    indices[iIdx + 3] = startVertex;
    indices[iIdx + 4] = startVertex + 3;
    indices[iIdx + 5] = startVertex + 2;
    iIdx += 6;

    quadMaterialIds.push(materialId);
    quadIndexRanges.push({ startVertex, startIndex });
    quadCount++;
  }

  for (const tile of tiles) {
    const baseX = tile.x;
    const baseY = tile.y;
    const h = tile.height;
    const underlayId = tile.underlayId ?? "grass";

    // Water tiles: render as a flat water quad at slightly below ground.
    if (tile.water) {
      writeQuad(baseX, baseY, h * 0.1 - 0.05, resolveColor("water"), "water");
      continue;
    }

    // Underlay quad.
    writeQuad(baseX, baseY, h * 0.1, resolveColor(underlayId), underlayId);

    // Overlay quad: render slightly above the underlay.
    if (tile.overlayId !== undefined) {
      writeQuad(baseX, baseY, h * 0.1 + 0.02, resolveColor(tile.overlayId), tile.overlayId);
    }
  }

  // Build material groups by grouping consecutive quads with the same materialId.
  // Since quads are written in tile order, we sort by materialId to build contiguous
  // index ranges. We need to reorder indices so each material group is contiguous.
  if (quadCount > 0) {
    // Collect (materialId, quadRange) pairs and group by materialId.
    const byMaterial = new Map<string, { startVertex: number; startIndex: number }[]>();
    for (let qi = 0; qi < quadCount; qi++) {
      const mid = quadMaterialIds[qi];
      if (!mid) continue;
      const ranges = byMaterial.get(mid) ?? [];
      ranges.push(quadIndexRanges[qi]!);
      byMaterial.set(mid, ranges);
    }

    // Rebuild indices contiguously per material group.
    const newIndices = new Uint32Array(indexCount);
    let newIdx = 0;
    for (const [materialId, ranges] of byMaterial) {
      const groupStart = newIdx;
      for (const range of ranges) {
        const sv = range.startVertex;
        newIndices[newIdx + 0] = sv;
        newIndices[newIdx + 1] = sv + 2;
        newIndices[newIdx + 2] = sv + 1;
        newIndices[newIdx + 3] = sv;
        newIndices[newIdx + 4] = sv + 3;
        newIndices[newIdx + 5] = sv + 2;
        newIdx += 6;
      }
      materialQuadRanges.push({ materialId, startIndex: groupStart, count: newIdx - groupStart });
    }
    // Copy reordered indices back.
    indices.set(newIndices.subarray(0, newIdx));
    // Truncate to actual used length.
    const finalIndices = indices.subarray(0, newIdx);
    return buildResult(
      chunkCoord,
      tiles,
      objectRefs,
      positions,
      normals,
      colors,
      finalIndices,
      materialQuadRanges,
      v,
    );
  }

  return buildResult(
    chunkCoord,
    tiles,
    objectRefs,
    positions,
    normals,
    colors,
    indices.subarray(0, iIdx),
    materialQuadRanges,
    v,
  );
}

function buildResult(
  chunkCoord: { cx: number; cy: number; plane: number },
  tiles: readonly RegionTileData[],
  objectRefs: readonly ObjectRef[],
  positions: Float32Array,
  normals: Float32Array,
  colors: Float32Array,
  indices: Uint32Array,
  materialGroups: readonly MaterialGroup[],
  vertexCount: number,
): BakedChunkPayload {
  // Trim arrays to actual used size.
  const trimmedPositions = positions.subarray(0, vertexCount * 3);
  const trimmedNormals = normals.subarray(0, vertexCount * 3);
  const trimmedColors = colors.subarray(0, vertexCount * 3);

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
    positions: trimmedPositions,
    normals: trimmedNormals,
    colors: trimmedColors,
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
    const { jobId, regionId, chunkCoord, tiles, objectRefs, materialColors } = msg;

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

      const payload = buildBakedChunkPayload(chunkCoord, tiles, objectRefs, materialColors);

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

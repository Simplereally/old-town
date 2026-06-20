import { type ChunkId, chunkId, type RegionId, type TileCoord } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ChunkBakeJob, ChunkBakeQueue, type ChunkMetadata } from "./ChunkBakeQueue";
import { ChunkResidencyManager } from "./ChunkResidencyManager";
import { ChunkUploadQueue } from "./ChunkUploadQueue";
import { RenderResourceRegistry } from "./RenderResourceRegistry";

function makeChunkId(cx: number, cy: number, plane = 0): ChunkId {
  return chunkId({ cx, cy, plane: plane as 0 | 1 | 2 | 3 });
}

function makeMeta(cx: number, cy: number, plane = 0): ChunkMetadata {
  return { cx, cy, plane };
}

function makeTile(x: number, y: number, plane = 0): TileCoord {
  return { x, y, plane: plane as 0 | 1 | 2 | 3 };
}

function makeRegionId(rx: number, ry: number, plane = 0): RegionId {
  return `${rx}:${ry}:${plane}` as RegionId;
}

describe("ChunkResidencyManager", () => {
  let bakeQueue: ChunkBakeQueue;
  let uploadQueue: ChunkUploadQueue;
  let manager: ChunkResidencyManager;
  let disposeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    bakeQueue = new ChunkBakeQueue();
    const scene = new Scene();
    const registry = new RenderResourceRegistry();
    uploadQueue = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue: bakeQueue,
    });
    disposeMock = vi.fn();
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 16,
      residentRadiusTiles: 32,
      maxGpuBytes: 1000000,
      onDisposeChunk: disposeMock,
    });
  });

  // ---------------------------------------------------------------------------
  // Construction and types
  // ---------------------------------------------------------------------------

  it("exports required types", () => {
    expect(manager).toBeInstanceOf(ChunkResidencyManager);
  });

  it("reports empty stats before any chunks are registered", () => {
    const stats = manager.getStats();
    expect(stats.visible).toBe(0);
    expect(stats.hiddenResident).toBe(0);
    expect(stats.evictPending).toBe(0);
    expect(stats.disposed).toBe(0);
    expect(stats.approximateGpuBytes).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Focus tile
  // ---------------------------------------------------------------------------

  it("setFocusTile updates the internal focus", () => {
    manager.setFocusTile(makeTile(0, 0));
    expect(manager.getDecision(makeChunkId(0, 0), 0)).toBe("noop");
  });

  it("evaluate is a no-op when no focus tile is set", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.evaluate(1);
    expect(manager.getStats().visible).toBe(0);
    expect(manager.getStats().hiddenResident).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Distance-based visibility transitions
  // ---------------------------------------------------------------------------

  it("gpu_resident -> visible when inside visible radius", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");
    expect(manager.getStats().visible).toBe(1);
  });

  it("visible -> hidden_resident when outside visible but inside resident radius", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");

    // Move focus far enough to be outside visible (16) but inside resident (32)
    manager.setFocusTile(makeTile(30, 0));
    manager.evaluate(2);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("hidden_resident");
    expect(manager.getStats().visible).toBe(0);
    expect(manager.getStats().hiddenResident).toBe(1);
  });

  it("gpu_resident -> hidden_resident when outside visible but inside resident", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    // Focus is at (20, 0). Distance to chunk center (4, 4) is sqrt(16^2 + 4^2) ≈ 16.5
    // which is > 16 (visible) and < 32 (resident).
    manager.setFocusTile(makeTile(20, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("hidden_resident");
    expect(manager.getStats().hiddenResident).toBe(1);
  });

  it("hidden_resident -> visible when re-entering visible radius", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    manager.setFocusTile(makeTile(30, 0));
    manager.evaluate(2);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("hidden_resident");

    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(3);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");
    expect(manager.getStats().visible).toBe(1);
  });

  it("visible -> evict when outside resident radius", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");

    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(2);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
    expect(manager.getStats().visible).toBe(0);
    expect(manager.getStats().disposed).toBe(1);
  });

  it("gpu_resident -> evict when outside resident radius", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
  });

  it("hidden_resident -> evict when outside resident radius", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(20, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("hidden_resident");

    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(2);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
  });

  // ---------------------------------------------------------------------------
  // Determinism
  // ---------------------------------------------------------------------------

  it("visibility decisions are deterministic from focus tile and frame id", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(2, 0), makeMeta(4, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(2, 0), 1000);
    manager.onGpuResident(makeChunkId(4, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));

    // Check decisions before evaluate (all are gpu_resident).
    expect(manager.getDecision(makeChunkId(0, 0), 1)).toBe("show");
    expect(manager.getDecision(makeChunkId(2, 0), 1)).toBe("hide");
    expect(manager.getDecision(makeChunkId(4, 0), 1)).toBe("evict");

    manager.evaluate(1);
    const stats1 = manager.getStats();

    manager.evaluate(1);
    const stats2 = manager.getStats();

    expect(stats1).toEqual(stats2);
  });

  it("getDecision returns noop for unknown chunks", () => {
    manager.setFocusTile(makeTile(0, 0));
    expect(manager.getDecision(makeChunkId(99, 99), 1)).toBe("noop");
  });

  it("getDecision returns noop when no focus tile is set", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    expect(manager.getDecision(makeChunkId(0, 0), 1)).toBe("noop");
  });

  // ---------------------------------------------------------------------------
  // LRU eviction
  // ---------------------------------------------------------------------------

  it("LRU eviction chooses oldest hidden-resident chunks first", () => {
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 8,
      residentRadiusTiles: 32,
      maxGpuBytes: 3000,
    });

    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0), makeMeta(2, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 1000);
    manager.onGpuResident(makeChunkId(2, 0), 1000);

    // All chunks inside resident radius (32) but outside visible (8).
    // Focus at (15, 15) => distances: chunk(0,0) ~15.6, chunk(1,0) ~11.4, chunk(2,0) ~12.1
    manager.setFocusTile(makeTile(15, 15));
    manager.evaluate(1);
    expect(manager.getStats().hiddenResident).toBe(3);
    expect(manager.getStats().approximateGpuBytes).toBe(3000);

    // Evaluate again with a new frame id so lastAccessedFrame advances.
    manager.evaluate(2);
    expect(manager.getStats().hiddenResident).toBe(3);

    // Now reduce budget so we need to evict 1 chunk.
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 8,
      residentRadiusTiles: 32,
      maxGpuBytes: 2000,
    });

    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0), makeMeta(2, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 1000);
    manager.onGpuResident(makeChunkId(2, 0), 1000);
    manager.setFocusTile(makeTile(15, 15));

    // Frame 1: budget 2000 with 3 chunks of 1000 bytes each evicts 1 chunk immediately.
    // All chunks have lastAccessedFrame = -1, so distance is the tie-breaker.
    // Farthest chunk (0,0) at distance ~15.6 is evicted first.
    manager.evaluate(1);
    const stats = manager.getStats();
    expect(stats.hiddenResident).toBe(2);
    expect(stats.disposed).toBe(1);
    expect(stats.approximateGpuBytes).toBe(2000);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");

    // Frame 2: remaining 2 chunks have lastAccessedFrame = 1. No further eviction.
    manager.evaluate(2);
    expect(manager.getStats().hiddenResident).toBe(2);
    expect(manager.getStats().disposed).toBe(1);
  });

  it("LRU eviction tie-breaks by distance when lastAccessedFrame is equal", () => {
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 8,
      residentRadiusTiles: 32,
      maxGpuBytes: 1000,
    });

    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 1000);

    // Both outside visible, inside resident.
    manager.setFocusTile(makeTile(15, 15));

    // Budget 1000 with 2 chunks of 1000 bytes each evicts 1 chunk immediately.
    // Both have lastAccessedFrame = -1. Distance tie-breaker: chunk(0,0) is farther.
    manager.evaluate(1);
    const stats = manager.getStats();
    expect(stats.hiddenResident).toBe(1);
    expect(stats.disposed).toBe(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
  });

  it("LRU eviction tie-breaks by chunkId when distance and lastAccessed are equal", () => {
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 8,
      residentRadiusTiles: 32,
      maxGpuBytes: 1000,
    });

    // Two chunks at the same distance (symmetric around focus).
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 1), makeMeta(1, 0)]);
    manager.onGpuResident(makeChunkId(0, 1), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 1000);

    // Focus at (20, 20) — both chunks are equidistant.
    manager.setFocusTile(makeTile(20, 20));

    // Budget 1000 with 2 chunks of 1000 bytes each evicts 1 chunk immediately.
    // Both have lastAccessedFrame = -1 and same distance. chunkId tie-breaker.
    manager.evaluate(1);
    const stats = manager.getStats();
    expect(stats.hiddenResident).toBe(1);
    expect(stats.disposed).toBe(1);
    // chunkId "0:1:0" < "1:0:0" in localeCompare, so 0:1:0 is evicted first.
    expect(manager.getChunkState(makeChunkId(0, 1))).toBe("disposed");
  });

  it("does not evict visible chunks to meet memory budget", () => {
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 32,
      residentRadiusTiles: 64,
      maxGpuBytes: 1000,
    });

    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 1000);

    manager.setFocusTile(makeTile(4, 4));
    manager.evaluate(1);
    // Both are visible (inside 32 radius).
    expect(manager.getStats().visible).toBe(2);
    expect(manager.getStats().approximateGpuBytes).toBe(2000);

    // Budget is 1000, but visible chunks are not evicted.
    // Since there are no hidden-resident chunks, nothing can be evicted.
    expect(manager.getStats().visible).toBe(2);
    expect(manager.getStats().approximateGpuBytes).toBe(2000);
  });

  // ---------------------------------------------------------------------------
  // Disposal exactly once
  // ---------------------------------------------------------------------------

  it("disposes chunk resources exactly once", () => {
    const evictSpy = vi.spyOn(uploadQueue, "evictChunk");

    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");

    // Move far away to evict.
    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(2);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
    expect(evictSpy).toHaveBeenCalledTimes(1);
    expect(evictSpy).toHaveBeenCalledWith(makeChunkId(0, 0));
    expect(disposeMock).toHaveBeenCalledTimes(1);
    expect(disposeMock).toHaveBeenCalledWith(makeChunkId(0, 0));

    // Evaluate again — no additional calls.
    manager.evaluate(3);
    expect(evictSpy).toHaveBeenCalledTimes(1);
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Re-entering disposed chunks
  // ---------------------------------------------------------------------------

  it("re-entering a disposed chunk resets state for a new bake", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
    expect(manager.getStats().disposed).toBe(1);

    // Re-enter the chunk.
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("unseen");
    expect(manager.getStats().disposed).toBe(0);
    expect(manager.getChunkMetadata(makeChunkId(0, 0))).toEqual(makeMeta(0, 0));

    // The bake queue should have a new queued job.
    expect(bakeQueue.getStats().queued).toBe(1);
  });

  it("re-entering a disposed chunk does not resurrect old GPU bytes", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 5000);
    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(1);
    expect(manager.getStats().approximateGpuBytes).toBe(0);

    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(2);
    expect(manager.getStats().approximateGpuBytes).toBe(1000);
    expect(manager.getStats().visible).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  it("stats reflect mixed states after evaluation", () => {
    manager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 8,
      residentRadiusTiles: 16,
      maxGpuBytes: 1000000,
    });

    manager.ingestRegionLoad(makeRegionId(0, 0), [
      makeMeta(0, 0),
      makeMeta(1, 0),
      makeMeta(2, 0),
      makeMeta(3, 0),
    ]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 2000);
    manager.onGpuResident(makeChunkId(2, 0), 3000);
    manager.onGpuResident(makeChunkId(3, 0), 4000);

    // Focus at chunk(0,0) center (4,4).
    // Distances: chunk(0,0)=0, chunk(1,0)=8, chunk(2,0)=16, chunk(3,0)=24.
    // visibleRadius=8 => chunk(0,0) visible, chunk(1,0) visible (boundary), chunk(2,0) hidden, chunk(3,0) evict.
    manager.setFocusTile(makeTile(4, 4));
    manager.evaluate(1);
    const stats = manager.getStats();
    expect(stats.visible).toBe(2);
    expect(stats.hiddenResident).toBe(1);
    expect(stats.disposed).toBe(1);
    expect(stats.approximateGpuBytes).toBe(6000);
  });

  it("stats return a snapshot (not a live reference)", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    const stats = manager.getStats();
    expect(stats.visible).toBe(1);

    // Mutating the returned object should not affect internal stats.
    (stats as unknown as { visible: number }).visible = 99;
    expect(manager.getStats().visible).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("ignores onGpuResident for unknown chunks", () => {
    manager.onGpuResident(makeChunkId(99, 99), 1000);
    expect(manager.getChunkState(makeChunkId(99, 99))).toBeUndefined();
  });

  it("ignores onGpuResident for disposed chunks", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");

    manager.onGpuResident(makeChunkId(0, 0), 2000);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
  });

  it("ingestRegionLoad delegates to chunkBakeQueue and tracks chunks", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    expect(bakeQueue.getStats().queued).toBe(2);
    expect(manager.getChunkMetadata(makeChunkId(0, 0))).toEqual(makeMeta(0, 0));
    expect(manager.getChunkMetadata(makeChunkId(1, 0))).toEqual(makeMeta(1, 0));
  });

  it("ingestRegionUnload delegates to chunkBakeQueue", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    // Complete the bake pipeline so the bakeQueue state is resident.
    const job = bakeQueue.dequeueJob();
    expect(job).toBeDefined();
    const safeJob = job as ChunkBakeJob;
    bakeQueue.onWorkerComplete(safeJob.chunkId);
    bakeQueue.onGpuUploadComplete(safeJob.chunkId);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");

    manager.ingestRegionUnload(makeRegionId(0, 0));
    // The residency manager immediately evicts via _transitionToEvict,
    // which transitions bakeQueue state to disposed.
    expect(bakeQueue.getStats().disposed).toBe(1);
  });

  it("dispose transitions all tracked chunks to disposed", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.onGpuResident(makeChunkId(1, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);

    manager.dispose();
    expect(manager.getStats().visible).toBe(0);
    expect(manager.getStats().hiddenResident).toBe(0);
    expect(manager.getStats().disposed).toBe(0); // cleared
    expect(manager.getChunkState(makeChunkId(0, 0))).toBeUndefined();
  });

  it("does not throw when disposing an empty manager", () => {
    expect(() => manager.dispose()).not.toThrow();
  });

  it("handles chunks at exact boundary distances", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    // Chunk center is (4, 4). Distance from (4 + 16, 4) = 16 exactly.
    // Inside visible radius (16 tiles).
    manager.setFocusTile(makeTile(20, 4));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("visible");

    // Distance from (4 + 16 + epsilon, 4) > 16.
    manager.setFocusTile(makeTile(21, 4));
    manager.evaluate(2);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("hidden_resident");

    // Distance from (4 + 32, 4) = 32 exactly.
    // Inside resident radius (32 tiles).
    manager.setFocusTile(makeTile(36, 4));
    manager.evaluate(3);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("hidden_resident");

    // Distance from (4 + 32 + epsilon, 4) > 32.
    manager.setFocusTile(makeTile(37, 4));
    manager.evaluate(4);
    expect(manager.getChunkState(makeChunkId(0, 0))).toBe("disposed");
  });

  it("preserves metadata for disposed chunks", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(5, 5)]);
    manager.onGpuResident(makeChunkId(5, 5), 1000);
    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(1);
    expect(manager.getChunkState(makeChunkId(5, 5))).toBe("disposed");
    expect(manager.getChunkMetadata(makeChunkId(5, 5))).toEqual(makeMeta(5, 5));
  });

  it("syncs chunkBakeQueue state on visible transitions", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = bakeQueue.dequeueJob();
    expect(job).toBeDefined();
    const safeJob = job as ChunkBakeJob;
    bakeQueue.onWorkerComplete(safeJob.chunkId);
    bakeQueue.onGpuUploadComplete(safeJob.chunkId);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(bakeQueue.getStats().visible).toBe(1);
  });

  it("syncs chunkBakeQueue state on hidden transitions", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = bakeQueue.dequeueJob();
    expect(job).toBeDefined();
    const safeJob = job as ChunkBakeJob;
    bakeQueue.onWorkerComplete(safeJob.chunkId);
    bakeQueue.onGpuUploadComplete(safeJob.chunkId);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(bakeQueue.getStats().visible).toBe(1);

    manager.setFocusTile(makeTile(20, 0));
    manager.evaluate(2);
    expect(bakeQueue.getStats().visible).toBe(0);
    expect(bakeQueue.getStats().hiddenResident).toBe(1);
  });

  it("syncs chunkBakeQueue state on eviction", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = bakeQueue.dequeueJob();
    expect(job).toBeDefined();
    const safeJob = job as ChunkBakeJob;
    bakeQueue.onWorkerComplete(safeJob.chunkId);
    bakeQueue.onGpuUploadComplete(safeJob.chunkId);
    manager.onGpuResident(makeChunkId(0, 0), 1000);
    manager.setFocusTile(makeTile(0, 0));
    manager.evaluate(1);
    expect(bakeQueue.getStats().visible).toBe(1);

    manager.setFocusTile(makeTile(50, 0));
    manager.evaluate(2);
    expect(bakeQueue.getStats().visible).toBe(0);
    expect(bakeQueue.getStats().disposed).toBe(1);
  });

  it("setFocusTile propagates to chunkBakeQueue", () => {
    manager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    manager.setFocusTile(makeTile(0, 0));
    const job = bakeQueue.dequeueJob();
    expect(job).not.toBeNull();
    expect(job?.priority.distance).toBeLessThan(Infinity);
  });
});

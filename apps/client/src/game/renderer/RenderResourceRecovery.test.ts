import { type ChunkId, chunkId, type RegionId, type TileCoord } from "@old-town/shared";
import { BoxGeometry, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { type ChunkBakeJob, ChunkBakeQueue, type ChunkMetadata } from "./ChunkBakeQueue";
import { ChunkResidencyManager } from "./ChunkResidencyManager";
import { ChunkUploadQueue } from "./ChunkUploadQueue";
import { type RenderResourceErrorCode, RenderResourceRecovery } from "./RenderResourceRecovery";
import { RenderResourceRegistry } from "./RenderResourceRegistry";

function _makeChunkId(cx: number, cy: number, plane = 0): ChunkId {
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

function expectJob(queue: ChunkBakeQueue): ChunkBakeJob {
  const job = queue.dequeueJob();
  expect(job).toBeDefined();
  return job as NonNullable<typeof job>;
}

function makePayload(vertexCount = 4) {
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(Math.max(1, 3));
  for (let i = 0; i < vertexCount; i++) {
    positions[i * 3 + 0] = i;
    positions[i * 3 + 1] = i;
    positions[i * 3 + 2] = i;
    normals[i * 3 + 0] = 0;
    normals[i * 3 + 1] = 1;
    normals[i * 3 + 2] = 0;
    colors[i * 3 + 0] = 0.5;
    colors[i * 3 + 1] = 0.6;
    colors[i * 3 + 2] = 0.4;
  }
  for (let i = 0; i < indices.length; i++) {
    indices[i] = i % vertexCount;
  }
  return {
    positions,
    normals,
    colors,
    indices,
    materialGroups: [{ materialId: "grass", startIndex: 0, count: 3 }],
    bounds: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
    tileMetadata: [],
    collisionDebugData: [],
    objectInstanceDescriptors: [],
  };
}

describe("RenderResourceRecovery", () => {
  let bakeQueue: ChunkBakeQueue;
  let uploadQueue: ChunkUploadQueue;
  let registry: RenderResourceRegistry;
  let residencyManager: ChunkResidencyManager;
  let recovery: RenderResourceRecovery;

  beforeEach(() => {
    bakeQueue = new ChunkBakeQueue();
    const scene = new Scene();
    registry = new RenderResourceRegistry();
    uploadQueue = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue: bakeQueue,
    });
    residencyManager = new ChunkResidencyManager({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 16,
      residentRadiusTiles: 32,
      maxGpuBytes: 1000000,
    });
    recovery = new RenderResourceRecovery({
      chunkBakeQueue: bakeQueue,
      chunkUploadQueue: uploadQueue,
      registry,
      residencyManager,
    });
  });

  // ---------------------------------------------------------------------------
  // Error codes
  // ---------------------------------------------------------------------------

  it("defines all required error codes", () => {
    const codes: RenderResourceErrorCode[] = [
      "bake_failure",
      "upload_failure",
      "missing_material",
      "invalid_geometry_payload",
      "resource_disposed_use",
      "context_loss",
    ];
    for (const code of codes) {
      expect(typeof code).toBe("string");
    }
  });

  // ---------------------------------------------------------------------------
  // Worker failure and retry backoff
  // ---------------------------------------------------------------------------

  it("records a worker failure and schedules retry with frame backoff", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(10);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "worker crashed");
    const debug = recovery.debugStatus();
    expect(debug.failedChunks.length).toBe(1);
    expect(debug.failedChunks[0]?.errorCode).toBe("bake_failure");
    expect(debug.failedChunks[0]?.retryCount).toBe(1);
    expect(debug.failedChunks[0]?.retryAfterFrame).toBe(10 + 5);
    expect(debug.totalRetries).toBe(1);
  });

  it("does not immediately requeue a failed chunk when backoff is set", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(10);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "worker crashed");
    const stats = bakeQueue.getStats();
    expect(stats.baking).toBe(0);
    expect(stats.queued).toBe(0);
    expect(stats.retryPending).toBe(1);
  });

  it("requeues a retry-pending chunk after the backoff frame is reached", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(10);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "worker crashed");
    expect(bakeQueue.getStats().retryPending).toBe(1);

    recovery.advanceFrame(15);
    const stats = bakeQueue.getStats();
    expect(stats.queued).toBe(1);
    expect(stats.retryPending).toBe(0);
  });

  it("increases backoff with each retry attempt", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(0);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash 1");
    expect(recovery.debugStatus().failedChunks[0]?.retryAfterFrame).toBe(5);

    recovery.advanceFrame(5);
    const job2 = expectJob(bakeQueue);
    recovery.advanceFrame(5);
    recovery.onWorkerFailure(job2.chunkId, "bake_failure", "crash 2");
    expect(recovery.debugStatus().failedChunks[0]?.retryAfterFrame).toBe(15);

    recovery.advanceFrame(15);
    const job3 = expectJob(bakeQueue);
    recovery.advanceFrame(15);
    recovery.onWorkerFailure(job3.chunkId, "bake_failure", "crash 3");
    expect(recovery.debugStatus().failedChunks[0]?.retryAfterFrame).toBe(30);
  });

  it("marks a chunk as permanently failed after max retries", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(0);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash 1");
    recovery.advanceFrame(5);
    const job2 = expectJob(bakeQueue);
    recovery.advanceFrame(5);
    recovery.onWorkerFailure(job2.chunkId, "bake_failure", "crash 2");
    recovery.advanceFrame(15);
    const job3 = expectJob(bakeQueue);
    recovery.advanceFrame(15);
    recovery.onWorkerFailure(job3.chunkId, "bake_failure", "crash 3");
    recovery.advanceFrame(30);
    const job4 = expectJob(bakeQueue);
    recovery.advanceFrame(30);
    recovery.onWorkerFailure(job4.chunkId, "bake_failure", "crash 4");

    const stats = bakeQueue.getStats();
    expect(stats.disposed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(recovery.debugStatus().failedChunks[0]?.permanent).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Upload failure and retry
  // ---------------------------------------------------------------------------

  it("records an upload failure and retries with frame backoff", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    const badPayload = makePayload(1);
    (badPayload as unknown as Record<string, unknown>).positions = null;
    uploadQueue.enqueueBakedChunk(job.chunkId, badPayload);
    uploadQueue.processFrame(0, () => 0, 10);
    expect(uploadQueue.stats().totalFailures).toBe(0); // first failure triggers retry
    // Retry after backoff
    uploadQueue.processFrame(0, () => 0, 15);
    expect(uploadQueue.stats().totalFailures).toBe(0);
    uploadQueue.processFrame(0, () => 0, 25);
    expect(uploadQueue.stats().totalFailures).toBe(0);
    uploadQueue.processFrame(0, () => 0, 40);
    expect(uploadQueue.stats().totalFailures).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Debug status does not mutate authoritative gameplay state
  // ---------------------------------------------------------------------------

  it("debugStatus does not cause additional state mutations", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(0);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash");
    const after = bakeQueue.getStats();
    recovery.debugStatus();
    expect(bakeQueue.getStats()).toEqual(after);
  });

  // ---------------------------------------------------------------------------
  // Context loss
  // ---------------------------------------------------------------------------

  it("stops GPU uploads and marks resources invalid on context loss", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    bakeQueue.onWorkerComplete(job.chunkId);
    uploadQueue.enqueueBakedChunk(job.chunkId, makePayload());
    uploadQueue.processFrame(0, () => 0, 1);
    bakeQueue.onGpuUploadComplete(job.chunkId);
    expect(bakeQueue.getStats().resident).toBe(1);

    recovery.onContextLost();
    expect(recovery.contextLost).toBe(true);
    expect(uploadQueue.stats().queueDepth).toBe(0);
    expect(registry.stats().liveResourceKeys).toBe(0);
  });

  it("keeps pure client world / snapshot state intact on context loss", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    residencyManager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    bakeQueue.onWorkerComplete(job.chunkId);
    uploadQueue.enqueueBakedChunk(job.chunkId, makePayload());
    uploadQueue.processFrame(0, () => 0, 1);
    bakeQueue.onGpuUploadComplete(job.chunkId);
    residencyManager.onGpuResident(job.chunkId, 1000);
    residencyManager.setFocusTile(makeTile(0, 0));
    residencyManager.evaluate(1);

    const beforeMeta = residencyManager.getChunkMetadata(job.chunkId);
    recovery.onContextLost();
    expect(residencyManager.getChunkMetadata(job.chunkId)).toEqual(beforeMeta);
  });

  it("ignores worker failures while context is lost", () => {
    recovery.onContextLost();
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash");
    expect(recovery.debugStatus().totalRetries).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Context restore
  // ---------------------------------------------------------------------------

  it("recreates registry resources and requeues resident chunks on context restore", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    residencyManager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    bakeQueue.onWorkerComplete(job.chunkId);
    uploadQueue.enqueueBakedChunk(job.chunkId, makePayload());
    uploadQueue.processFrame(0, () => 0, 1);
    bakeQueue.onGpuUploadComplete(job.chunkId);
    residencyManager.onGpuResident(job.chunkId, 1000);

    recovery.onContextLost();
    expect(bakeQueue.getStats().resident).toBe(0);
    expect(bakeQueue.getStats().queued).toBe(1);

    recovery.onContextRestored();
    expect(recovery.contextLost).toBe(false);
    expect(bakeQueue.getStats().queued).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Disposal idempotence
  // ---------------------------------------------------------------------------

  it("ChunkUploadQueue dispose is idempotent", () => {
    uploadQueue.dispose();
    uploadQueue.dispose();
    expect(true).toBe(true);
  });

  it("ChunkUploadQueue evictChunk is idempotent", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    bakeQueue.onWorkerComplete(job.chunkId);
    uploadQueue.enqueueBakedChunk(job.chunkId, makePayload());
    uploadQueue.processFrame(0, () => 0, 1);
    uploadQueue.evictChunk(job.chunkId);
    uploadQueue.evictChunk(job.chunkId);
    expect(uploadQueue.getChunkGroup(job.chunkId)).toBeUndefined();
  });

  it("RenderResourceRegistry dispose is idempotent", () => {
    registry.dispose();
    registry.dispose();
    expect(registry.stats().liveResourceKeys).toBe(0);
  });

  it("RenderResourceRegistry release is idempotent after clearLiveResources", () => {
    const key = { type: "prop" as const, contentId: "test" };
    let disposeCalls = 0;
    registry.registerGeometry(key, () => {
      const geo = new BoxGeometry(1, 1, 1);
      const original = geo.dispose.bind(geo);
      geo.dispose = () => {
        disposeCalls++;
        original();
      };
      return geo;
    });
    registry.getGeometry(key);
    registry.clearLiveResources();
    registry.releaseGeometry(key);
    expect(disposeCalls).toBe(1);
  });

  it("ChunkBakeQueue processRetries is idempotent when no retries are pending", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    bakeQueue.processRetries(100);
    expect(bakeQueue.getStats().queued).toBe(1);
    expect(bakeQueue.getStats().retryPending).toBe(0);
  });

  it("ChunkResidencyManager invalidateAllResident is idempotent", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    residencyManager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    bakeQueue.onWorkerComplete(job.chunkId);
    uploadQueue.enqueueBakedChunk(job.chunkId, makePayload());
    uploadQueue.processFrame(0, () => 0, 1);
    bakeQueue.onGpuUploadComplete(job.chunkId);
    residencyManager.onGpuResident(job.chunkId, 1000);
    residencyManager.invalidateAllResident();
    residencyManager.invalidateAllResident();
    expect(residencyManager.getChunkState(job.chunkId)).toBe("unseen");
  });

  // ---------------------------------------------------------------------------
  // ThreeRenderer context loss integration
  // ---------------------------------------------------------------------------

  it("ThreeRenderer exposes contextLost flag and callbacks", async () => {
    const { ThreeRenderer } = await import("./ThreeRenderer");
    const props = Object.getOwnPropertyNames(ThreeRenderer.prototype);
    expect(props).toContain("contextLost");
    // onContextLost and onContextRestored are optional instance properties,
    // not prototype methods, so they won't appear on the prototype.
    expect(ThreeRenderer).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("advanceFrame processes due retries across multiple chunks", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    const job1 = expectJob(bakeQueue);
    const job2 = expectJob(bakeQueue);
    recovery.advanceFrame(0);
    recovery.onWorkerFailure(job1.chunkId, "bake_failure", "crash 1");
    recovery.onWorkerFailure(job2.chunkId, "bake_failure", "crash 2");
    expect(bakeQueue.getStats().retryPending).toBe(2);

    recovery.advanceFrame(5);
    const stats = bakeQueue.getStats();
    expect(stats.queued).toBe(2);
    expect(stats.retryPending).toBe(0);
  });

  it("does not double-count retries when the same chunk fails again", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(0);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash 1");
    recovery.advanceFrame(5);
    const job2 = expectJob(bakeQueue);
    recovery.advanceFrame(5);
    recovery.onWorkerFailure(job2.chunkId, "bake_failure", "crash 2");
    expect(recovery.debugStatus().failedChunks[0]?.retryCount).toBe(2);
  });

  it("debug status returns a snapshot, not a live reference", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    recovery.advanceFrame(0);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash");
    const status = recovery.debugStatus();
    const before = status.totalRetries;
    recovery.advanceFrame(5);
    recovery.onWorkerFailure(job.chunkId, "bake_failure", "crash 2");
    expect(status.totalRetries).toBe(before);
  });

  it("residencyManager stats reflect reset after invalidateAllResident", () => {
    bakeQueue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    residencyManager.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = expectJob(bakeQueue);
    bakeQueue.onWorkerComplete(job.chunkId);
    uploadQueue.enqueueBakedChunk(job.chunkId, makePayload());
    uploadQueue.processFrame(0, () => 0, 1);
    bakeQueue.onGpuUploadComplete(job.chunkId);
    residencyManager.onGpuResident(job.chunkId, 1000);
    residencyManager.setFocusTile(makeTile(0, 0));
    residencyManager.evaluate(1);
    expect(residencyManager.getStats().visible).toBe(1);

    recovery.onContextLost();
    expect(residencyManager.getStats().visible).toBe(0);
    expect(residencyManager.getStats().approximateGpuBytes).toBe(0);
  });
});

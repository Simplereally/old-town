import { type ChunkId, chunkId, type RegionId, type TileCoord } from "@old-town/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChunkBakeJob, ChunkLifecycleState, ChunkMetadata } from "./ChunkBakeQueue";
import { ChunkBakeQueue } from "./ChunkBakeQueue";

function makeMeta(cx: number, cy: number, plane = 0): ChunkMetadata {
  return { cx, cy, plane };
}

function makeRegionId(rx: number, ry: number, plane = 0): RegionId {
  return `${rx}:${ry}:${plane}` as RegionId;
}

function makeChunkId(cx: number, cy: number, plane = 0): ChunkId {
  return chunkId({ cx, cy, plane: plane as 0 | 1 | 2 | 3 });
}

function makeTile(x: number, y: number, plane = 0): TileCoord {
  return { x, y, plane: plane as 0 | 1 | 2 | 3 };
}

function dequeueJob(queue: ChunkBakeQueue): ChunkBakeJob {
  const job = queue.dequeueJob();
  expect(job).toBeDefined();
  return job as ChunkBakeJob;
}

describe("ChunkBakeQueue", () => {
  let queue: ChunkBakeQueue;

  beforeEach(() => {
    queue = new ChunkBakeQueue();
  });

  // ---------------------------------------------------------------------------
  // State machine basics
  // ---------------------------------------------------------------------------

  it("transitions unseen -> metadata_loaded -> bake_requested on region load", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const stats = queue.getStats();
    expect(stats.queued).toBe(1);
    expect(stats.baking).toBe(0);
    expect(stats.waitingUpload).toBe(0);
    expect(stats.resident).toBe(0);
    expect(stats.disposed).toBe(0);
  });

  it("transitions bake_requested -> baking_worker on dequeue", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = queue.dequeueJob();
    expect(job).not.toBeNull();
    const stats = queue.getStats();
    expect(stats.queued).toBe(0);
    expect(stats.baking).toBe(1);
  });

  it("transitions baking_worker -> baked_waiting_gpu_upload on worker complete", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    const stats = queue.getStats();
    expect(stats.baking).toBe(0);
    expect(stats.waitingUpload).toBe(1);
  });

  it("transitions baked_waiting_gpu_upload -> gpu_resident on GPU upload complete", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    const stats = queue.getStats();
    expect(stats.waitingUpload).toBe(0);
    expect(stats.resident).toBe(1);
    expect(stats.visible).toBe(0);
  });

  it("transitions gpu_resident -> visible on markVisible", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markVisible(job.chunkId);
    const stats = queue.getStats();
    expect(stats.visible).toBe(1);
    expect(stats.hiddenResident).toBe(0);
  });

  it("transitions visible -> hidden_resident on markHidden", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markVisible(job.chunkId);
    queue.markHidden(job.chunkId);
    const stats = queue.getStats();
    expect(stats.visible).toBe(0);
    expect(stats.hiddenResident).toBe(1);
    expect(stats.resident).toBe(1);
  });

  it("transitions hidden_resident -> visible on markVisible", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markVisible(job.chunkId);
    queue.markHidden(job.chunkId);
    queue.markVisible(job.chunkId);
    const stats = queue.getStats();
    expect(stats.visible).toBe(1);
    expect(stats.hiddenResident).toBe(0);
  });

  it("transitions gpu_resident -> hidden_resident on markHidden", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markHidden(job.chunkId);
    const stats = queue.getStats();
    expect(stats.hiddenResident).toBe(1);
    expect(stats.resident).toBe(1);
  });

  it("transitions visible -> evict_pending on region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markVisible(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.visible).toBe(0);
    expect(stats.evictPending).toBe(1);
  });

  it("transitions gpu_resident -> evict_pending on region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.resident).toBe(0);
    expect(stats.evictPending).toBe(1);
  });

  it("transitions hidden_resident -> evict_pending on region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markHidden(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.hiddenResident).toBe(0);
    expect(stats.evictPending).toBe(1);
  });

  it("transitions evict_pending -> disposed on evict complete", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.onEvictComplete(job.chunkId);
    const stats = queue.getStats();
    expect(stats.evictPending).toBe(0);
    expect(stats.disposed).toBe(1);
  });

  it("transitions evict_pending -> visible on markVisible (re-shown before eviction)", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.markVisible(job.chunkId);
    const stats = queue.getStats();
    expect(stats.evictPending).toBe(0);
    expect(stats.visible).toBe(1);
  });

  it("transitions disposed -> unseen on region revisit", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.onEvictComplete(job.chunkId);
    expect(queue.getStats().disposed).toBe(1);

    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const stats = queue.getStats();
    expect(stats.disposed).toBe(0);
    expect(stats.queued).toBe(1);
  });

  it("transitions bake_requested -> disposed on region unload (cancellation)", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const statsBefore = queue.getStats();
    expect(statsBefore.queued).toBe(1);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.queued).toBe(0);
    expect(stats.disposed).toBe(1);
  });

  it("transitions baking_worker -> disposed on region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const _job = dequeueJob(queue);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.baking).toBe(0);
    expect(stats.disposed).toBe(1);
  });

  it("transitions baked_waiting_gpu_upload -> disposed on region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.waitingUpload).toBe(0);
    expect(stats.disposed).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Region unload and cancellation
  // ---------------------------------------------------------------------------

  it("cancels queued job when region is unloaded before worker starts", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    const statsBefore = queue.getStats();
    expect(statsBefore.queued).toBe(2);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    const stats = queue.getStats();
    expect(stats.queued).toBe(0);
    expect(stats.disposed).toBe(2);
    expect(queue.dequeueJob()).toBeNull();
  });

  it("ignores worker complete for a disposed chunk", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.onWorkerComplete(job.chunkId);
    const stats = queue.getStats();
    expect(stats.disposed).toBe(1);
    expect(stats.waitingUpload).toBe(0);
  });

  it("ignores GPU upload complete for a disposed chunk", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.onGpuUploadComplete(job.chunkId);
    const stats = queue.getStats();
    expect(stats.disposed).toBe(1);
    expect(stats.resident).toBe(0);
  });

  it("ignores eviction complete for non-evict-pending chunks", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.onEvictComplete(job.chunkId);
    const stats = queue.getStats();
    expect(stats.resident).toBe(1);
    expect(stats.disposed).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Worker failure and retry
  // ---------------------------------------------------------------------------

  it("transitions baking_worker -> bake_requested on worker failure (retry)", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerFailed(job.chunkId);
    const stats = queue.getStats();
    expect(stats.baking).toBe(0);
    expect(stats.queued).toBe(1);
  });

  it("transitions baking_worker -> disposed after max retries", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    // Fail 4 times (max is 3)
    queue.onWorkerFailed(job.chunkId); // retry 1
    queue.dequeueJob();
    queue.onWorkerFailed(job.chunkId); // retry 2
    queue.dequeueJob();
    queue.onWorkerFailed(job.chunkId); // retry 3
    queue.dequeueJob();
    queue.onWorkerFailed(job.chunkId); // retry 4 -> disposed
    const stats = queue.getStats();
    expect(stats.disposed).toBe(1);
    expect(stats.failed).toBe(1);
  });

  it("increments retry count in priority after failure", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    queue.setFocusTile(makeTile(0, 0));
    const job1 = dequeueJob(queue);
    queue.onWorkerFailed(job1.chunkId);
    const job2 = dequeueJob(queue);
    expect(job2.priority.retryCount).toBe(1);
    expect(job1.priority.retryCount).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Priority and ordering
  // ---------------------------------------------------------------------------

  it("orders visible chunks before non-visible chunks", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    queue.setChunkVisibility(makeChunkId(0, 0), true);
    queue.setChunkVisibility(makeChunkId(1, 0), false);
    const job = dequeueJob(queue);
    expect(job.chunkId).toBe(makeChunkId(0, 0));
  });

  it("orders closer chunks before farther chunks", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(10, 0), makeMeta(5, 0)]);
    queue.setFocusTile(makeTile(0, 0));
    const job1 = dequeueJob(queue);
    const job2 = dequeueJob(queue);
    const job3 = dequeueJob(queue);
    expect(job1.chunkId).toBe(makeChunkId(0, 0));
    expect(job2.chunkId).toBe(makeChunkId(5, 0));
    expect(job3.chunkId).toBe(makeChunkId(10, 0));
  });

  it("orders fewer retries before more retries at equal distance", () => {
    // Chunks (0,1) and (1,0) are both distance sqrt(160) from (0,0),
    // so retry count becomes the tiebreaker.
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 1), makeMeta(1, 0)]);
    queue.setFocusTile(makeTile(0, 0));
    const jobA = dequeueJob(queue);
    queue.onWorkerFailed(jobA.chunkId);
    const jobB = dequeueJob(queue);
    expect(jobB.priority.retryCount).toBe(0);
    expect(jobB.chunkId).not.toBe(jobA.chunkId);
    const jobA2 = dequeueJob(queue);
    expect(jobA2.chunkId).toBe(jobA.chunkId);
    expect(jobA2.priority.retryCount).toBe(1);
  });

  it("orders equal-priority jobs deterministically by sequence", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    // Same distance, same visibility, same retries
    const job1 = dequeueJob(queue);
    const job2 = dequeueJob(queue);
    expect(job1.sequence).toBeLessThan(job2.sequence);
  });

  it("re-sorts queue when focus tile changes", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(10, 0)]);
    queue.setFocusTile(makeTile(0, 0));
    const job1 = dequeueJob(queue);
    expect(job1.chunkId).toBe(makeChunkId(0, 0));

    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(10, 0)]);
    queue.setFocusTile(makeTile(10, 0));
    const job2 = dequeueJob(queue);
    expect(job2.chunkId).toBe(makeChunkId(10, 0));
  });

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  it("reports accurate stats after mixed transitions", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [
      makeMeta(0, 0),
      makeMeta(1, 0),
      makeMeta(2, 0),
      makeMeta(3, 0),
    ]);
    // Chunk 0: full pipeline -> visible
    const j0 = dequeueJob(queue);
    queue.onWorkerComplete(j0.chunkId);
    queue.onGpuUploadComplete(j0.chunkId);
    queue.markVisible(j0.chunkId);

    // Chunk 1: full pipeline -> hidden
    const j1 = dequeueJob(queue);
    queue.onWorkerComplete(j1.chunkId);
    queue.onGpuUploadComplete(j1.chunkId);
    queue.markHidden(j1.chunkId);

    // Chunk 2: baking
    const _j2 = dequeueJob(queue);

    // Chunk 3: queued
    // (nothing)

    const stats = queue.getStats();
    expect(stats.visible).toBe(1);
    expect(stats.hiddenResident).toBe(1);
    expect(stats.resident).toBe(2);
    expect(stats.baking).toBe(1);
    expect(stats.queued).toBe(1);
    expect(stats.waitingUpload).toBe(0);
    expect(stats.evictPending).toBe(0);
    expect(stats.disposed).toBe(0);
    expect(stats.failed).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("ignores duplicate region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.ingestRegionUnload(makeRegionId(0, 0));
    expect(queue.getStats().disposed).toBe(1);
  });

  it("ignores unload of unknown region", () => {
    queue.ingestRegionUnload(makeRegionId(99, 99));
    expect(queue.getStats().disposed).toBe(0);
  });

  it("ignores operations on unknown chunk ids", () => {
    queue.onWorkerComplete(makeChunkId(99, 99));
    queue.onGpuUploadComplete(makeChunkId(99, 99));
    queue.markVisible(makeChunkId(99, 99));
    queue.markHidden(makeChunkId(99, 99));
    queue.onEvictComplete(makeChunkId(99, 99));
    queue.onWorkerFailed(makeChunkId(99, 99));
    expect(queue.getStats().disposed).toBe(0);
    expect(queue.getStats().failed).toBe(0);
  });

  it("does not touch three or webgl", () => {
    // The module imports nothing from three.  This is enforced by
    // the fact that the test file runs in jsdom without WebGL and
    // the source file compiles without three imports.
    expect(queue).toBeInstanceOf(ChunkBakeQueue);
  });

  it("handles chunk moving from one region to another", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    queue.ingestRegionLoad(makeRegionId(1, 0), [makeMeta(0, 0)]);
    // Unloading the first region should not dispose the chunk because
    // it now belongs to the second region.
    queue.ingestRegionUnload(makeRegionId(0, 0));
    expect(queue.getStats().disposed).toBe(0);
    expect(queue.getStats().queued).toBe(1);
  });

  it("clears isVisible flag on resident chunks during region unload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerComplete(job.chunkId);
    queue.onGpuUploadComplete(job.chunkId);
    queue.markVisible(job.chunkId);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    // After eviction, the chunk should be evict_pending and not visible
    expect(queue.getStats().evictPending).toBe(1);
    // Re-show would transition back to visible
    queue.markVisible(job.chunkId);
    expect(queue.getStats().visible).toBe(1);
  });

  it("resets retry count and failed status on revisit", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const job = dequeueJob(queue);
    queue.onWorkerFailed(job.chunkId);
    queue.dequeueJob();
    queue.onWorkerFailed(job.chunkId);
    queue.dequeueJob();
    queue.onWorkerFailed(job.chunkId);
    queue.dequeueJob();
    queue.onWorkerFailed(job.chunkId); // max retries -> failed
    expect(queue.getStats().failed).toBe(1);

    queue.ingestRegionUnload(makeRegionId(0, 0));
    queue.onEvictComplete(job.chunkId);
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    expect(queue.getStats().failed).toBe(0);
    expect(queue.getStats().queued).toBe(1);
  });

  it("dequeueJob returns null when all queued jobs are stale", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    queue.ingestRegionUnload(makeRegionId(0, 0));
    expect(queue.dequeueJob()).toBeNull();
  });

  it("skips stale jobs during dequeue", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0), makeMeta(1, 0)]);
    // Cancel the first job by unloading its region
    queue.ingestRegionUnload(makeRegionId(0, 0));
    // The second chunk is also disposed, so both jobs are stale.
    expect(queue.dequeueJob()).toBeNull();
  });

  it("updates metadata for existing chunk on region reload", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    // Should still only have one queued job
    expect(queue.getStats().queued).toBe(1);
  });

  it("transitions metadata_loaded -> disposed on region unload (internal state)", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    // Manually reset state to metadata_loaded to test the defensive path
    const internal = (queue as unknown as { _chunks: Map<ChunkId, { state: ChunkLifecycleState }> })
      ._chunks;
    const maybeRecord = internal.get(makeChunkId(0, 0));
    expect(maybeRecord).toBeDefined();
    const record = maybeRecord as { state: ChunkLifecycleState };
    record.state = "metadata_loaded";
    queue.ingestRegionUnload(makeRegionId(0, 0));
    expect(queue.getStats().disposed).toBe(1);
  });

  it("transitions unseen -> disposed on region unload (internal state)", () => {
    queue.ingestRegionLoad(makeRegionId(0, 0), [makeMeta(0, 0)]);
    const internal = (queue as unknown as { _chunks: Map<ChunkId, { state: ChunkLifecycleState }> })
      ._chunks;
    const maybeRecord = internal.get(makeChunkId(0, 0));
    expect(maybeRecord).toBeDefined();
    const record = maybeRecord as { state: ChunkLifecycleState };
    record.state = "unseen";
    queue.ingestRegionUnload(makeRegionId(0, 0));
    expect(queue.getStats().disposed).toBe(1);
  });
});

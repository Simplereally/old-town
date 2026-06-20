import { type ChunkId, chunkId } from "@old-town/shared";
import { BufferGeometry, type Material, Mesh, Scene } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ChunkBakeJob, ChunkBakeQueue } from "./ChunkBakeQueue";
import type { BakedChunkPayload, MaterialGroup } from "./ChunkBakeWorkerClient";
import {
  ChunkUploadQueue,
  DEFAULT_UPLOAD_BUDGET,
  type QueuedChunkUpload,
} from "./ChunkUploadQueue";
import { RenderResourceRegistry } from "./RenderResourceRegistry";

function makeChunkId(cx: number, cy: number, plane = 0): ChunkId {
  return chunkId({ cx, cy, plane: plane as 0 | 1 | 2 | 3 });
}

function makePayload(groups: MaterialGroup[], vertexCount = 4): BakedChunkPayload {
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(Math.max(1, groups.length * 3));

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
    materialGroups: groups,
    bounds: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
    tileMetadata: [],
    collisionDebugData: [],
    objectInstanceDescriptors: [],
  };
}

function expectDequeueJob(queue: ChunkBakeQueue): ChunkBakeJob {
  const job = queue.dequeueJob();
  expect(job).toBeDefined();
  return job as ChunkBakeJob;
}

describe("ChunkUploadQueue", () => {
  const originalPerformanceNow = performance.now;
  let scene: Scene;
  let registry: RenderResourceRegistry;
  let chunkBakeQueue: ChunkBakeQueue;
  let queue: ChunkUploadQueue;

  beforeEach(() => {
    scene = new Scene();
    registry = new RenderResourceRegistry();
    chunkBakeQueue = new ChunkBakeQueue();
    queue = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(performance, "now", {
      configurable: true,
      value: originalPerformanceNow,
    });
  });

  // ---------------------------------------------------------------------------
  // Types and budget
  // ---------------------------------------------------------------------------

  it("exports ChunkUploadBudget with default 2ms / 1 chunk", () => {
    expect(DEFAULT_UPLOAD_BUDGET.maxMsPerFrame).toBe(2);
    expect(DEFAULT_UPLOAD_BUDGET.maxChunksPerFrame).toBe(1);
  });

  it("uses default budget when none is provided", () => {
    const q = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue,
    });
    // Process a frame with a tiny budget so it stops immediately
    const start = 0;
    const nowFn = () => 10; // elapsed = 10ms > 2ms
    q.processFrame(start, nowFn);
    expect(q.stats().queueDepth).toBe(0);
  });

  it("uses custom budget when provided", () => {
    const q = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue,
      budget: { maxMsPerFrame: 10, maxChunksPerFrame: 3 },
    });
    const id1 = makeChunkId(0, 0);
    const id2 = makeChunkId(1, 0);
    const id3 = makeChunkId(2, 0);
    const id4 = makeChunkId(3, 0);
    q.enqueueBakedChunk(id1, makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]));
    q.enqueueBakedChunk(id2, makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]));
    q.enqueueBakedChunk(id3, makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]));
    q.enqueueBakedChunk(id4, makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]));

    const start = 0;
    const now = 0;
    const nowFn = () => now;
    q.processFrame(start, nowFn);
    // Custom budget allows 3 chunks per frame
    expect(q.stats().totalUploads).toBe(3);
    expect(q.stats().queueDepth).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Enqueue and lifecycle
  // ---------------------------------------------------------------------------

  it("enqueueBakedChunk marks lifecycle state baked_waiting_gpu_upload", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    const stats = chunkBakeQueue.getStats();
    expect(stats.waitingUpload).toBe(1);
  });

  it("processFrame uploads a queued chunk and transitions to gpu_resident", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    const stats = chunkBakeQueue.getStats();
    expect(stats.waitingUpload).toBe(0);
    expect(stats.resident).toBe(1);
    expect(queue.stats().totalUploads).toBe(1);
  });

  it("uses performance.now with the correct receiver when no clock is injected", () => {
    Object.defineProperty(performance, "now", {
      configurable: true,
      value: function now(this: Performance): number {
        if (this !== performance) {
          throw new TypeError(
            "'now' called on an object that does not implement interface Performance.",
          );
        }
        return 0;
      },
    });

    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );

    expect(() => queue.processFrame(0)).not.toThrow();
    expect(queue.stats().totalUploads).toBe(1);
  });

  it("processFrame respects maxMsPerFrame budget", () => {
    const _id1 = makeChunkId(0, 0);
    const _id2 = makeChunkId(1, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
      { cx: 1, cy: 0, plane: 0 },
    ]);
    const job1 = expectDequeueJob(chunkBakeQueue);
    const job2 = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job1.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.enqueueBakedChunk(
      job2.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );

    // Budget is 2ms. Start at 0, but after 3ms elapsed, second upload is skipped.
    let now = 0;
    const nowFn = () => now;
    queue.processFrame(0, nowFn);
    now = 10; // elapsed = 10ms > 2ms
    queue.processFrame(0, nowFn);
    expect(queue.stats().totalUploads).toBe(1);
    expect(queue.stats().queueDepth).toBe(1);
  });

  it("processFrame respects maxChunksPerFrame budget", () => {
    const q = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue,
      budget: { maxMsPerFrame: 100, maxChunksPerFrame: 1 },
    });
    const _id1 = makeChunkId(0, 0);
    const _id2 = makeChunkId(1, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
      { cx: 1, cy: 0, plane: 0 },
    ]);
    const job1 = expectDequeueJob(chunkBakeQueue);
    const job2 = expectDequeueJob(chunkBakeQueue);
    q.enqueueBakedChunk(
      job1.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    q.enqueueBakedChunk(
      job2.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    q.processFrame(0, () => 0);
    expect(q.stats().totalUploads).toBe(1);
    expect(q.stats().queueDepth).toBe(1);
  });

  it("processFrame drains queue across multiple frames", () => {
    const q = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue,
      budget: { maxMsPerFrame: 100, maxChunksPerFrame: 1 },
    });
    const _id1 = makeChunkId(0, 0);
    const _id2 = makeChunkId(1, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
      { cx: 1, cy: 0, plane: 0 },
    ]);
    const job1 = expectDequeueJob(chunkBakeQueue);
    const job2 = expectDequeueJob(chunkBakeQueue);
    q.enqueueBakedChunk(
      job1.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    q.enqueueBakedChunk(
      job2.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    q.processFrame(0, () => 0);
    q.processFrame(0, () => 0);
    expect(q.stats().totalUploads).toBe(2);
    expect(q.stats().queueDepth).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Geometry and material
  // ---------------------------------------------------------------------------

  it("builds BufferGeometry from transferred typed arrays", () => {
    const _id = makeChunkId(0, 0);
    const payload = makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(job.chunkId, payload);
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    expect(group).toBeDefined();
    const mesh = group?.children[0] as Mesh;
    expect(mesh.geometry).toBeInstanceOf(BufferGeometry);
    expect(mesh.geometry.attributes.position).toBeDefined();
    expect(mesh.geometry.attributes.normal).toBeDefined();
    expect(mesh.geometry.attributes.color).toBeDefined();
    expect(mesh.geometry.index).toBeDefined();
  });

  it("sets BufferAttribute usage before first render", () => {
    const _id = makeChunkId(0, 0);
    const payload = makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(job.chunkId, payload);
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    const mesh = group?.children[0] as Mesh;
    expect(
      (mesh.geometry.attributes.position as import("three").BufferAttribute).usage,
    ).toBeGreaterThan(0);
    expect(
      (mesh.geometry.attributes.normal as import("three").BufferAttribute).usage,
    ).toBeGreaterThan(0);
    expect(
      (mesh.geometry.attributes.color as import("three").BufferAttribute).usage,
    ).toBeGreaterThan(0);
    expect((mesh.geometry.index as import("three").BufferAttribute).usage).toBeGreaterThan(0);
  });

  it("creates or reuses materials through RenderResourceRegistry", () => {
    const _id1 = makeChunkId(0, 0);
    const _id2 = makeChunkId(1, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 1, cy: 0, plane: 0 },
    ]);
    const job1 = expectDequeueJob(chunkBakeQueue);
    const job2 = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job1.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.enqueueBakedChunk(
      job2.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    queue.processFrame(0, () => 0);
    const group1 = queue.getChunkGroup(job1.chunkId);
    const group2 = queue.getChunkGroup(job2.chunkId);
    const mesh1 = group1?.children[0] as Mesh;
    const mesh2 = group2?.children[0] as Mesh;
    // Both meshes should share the same material instance
    if (Array.isArray(mesh1.material)) {
      expect(mesh1.material[0]).toBe((mesh2.material as Material[])[0]);
    } else {
      expect(mesh1.material).toBe(mesh2.material);
    }
  });

  it("groups terrain geometry by material layer", () => {
    const _id = makeChunkId(0, 0);
    const payload = makePayload(
      [
        { materialId: "grass", startIndex: 0, count: 3 },
        { materialId: "dirt", startIndex: 3, count: 3 },
      ],
      6,
    );
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(job.chunkId, payload);
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    const mesh = group?.children[0] as Mesh;
    expect(mesh.geometry.groups.length).toBe(2);
    expect(mesh.geometry.groups[0]?.materialIndex).toBe(0);
    expect(mesh.geometry.groups[1]?.materialIndex).toBe(1);
    expect(Array.isArray(mesh.material)).toBe(true);
    expect((mesh.material as Material[]).length).toBe(2);
  });

  it("does not create duplicate materials per chunk", () => {
    const _id = makeChunkId(0, 0);
    const payload = makePayload(
      [
        { materialId: "grass", startIndex: 0, count: 3 },
        { materialId: "grass", startIndex: 3, count: 3 },
      ],
      6,
    );
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(job.chunkId, payload);
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    const mesh = group?.children[0] as Mesh;
    expect(mesh.geometry.groups.length).toBe(2);
    // Both groups should use the same material index
    expect(mesh.geometry.groups[0]?.materialIndex).toBe(0);
    expect(mesh.geometry.groups[1]?.materialIndex).toBe(0);
    expect((mesh.material as Material[]).length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Combat flag
  // ---------------------------------------------------------------------------

  it("exposes canUploadHeavyResources flag", () => {
    const q = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue,
      canUploadHeavyResources: () => false,
    });
    expect(q.canUploadHeavyResources).toBe(false);
  });

  it("defaults canUploadHeavyResources to true when no predicate is provided", () => {
    expect(queue.canUploadHeavyResources).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Stats and HUD
  // ---------------------------------------------------------------------------

  it("exposes upload queue depth", () => {
    const id = makeChunkId(0, 0);
    queue.enqueueBakedChunk(id, makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]));
    expect(queue.stats().queueDepth).toBe(1);
  });

  it("exposes last upload duration", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    expect(queue.stats().lastUploadDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("stats reflect total uploads and failures", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    const stats = queue.stats();
    expect(stats.totalUploads).toBe(1);
    expect(stats.totalFailures).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Failure handling
  // ---------------------------------------------------------------------------

  it("records failure state and disposes partial geometry on upload failure", () => {
    const _id = makeChunkId(0, 0);
    const badPayload = makePayload([{ materialId: "grass", startIndex: 0, count: 3 }], 1);
    // Force a failure by passing an invalid typed array
    (badPayload as unknown as Record<string, unknown>).positions = null;
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(job.chunkId, badPayload);
    // With retry logic, the first failure is scheduled for retry.
    queue.processFrame(0, () => 0, 0);
    expect(queue.stats().totalFailures).toBe(0);
    // Exhaust retries (3 max) over subsequent frames.
    queue.processFrame(0, () => 0, 5);
    queue.processFrame(0, () => 0, 15);
    queue.processFrame(0, () => 0, 30);
    expect(queue.stats().totalFailures).toBe(1);
    expect(queue.getChunkGroup(job.chunkId)).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Eviction
  // ---------------------------------------------------------------------------

  it("evictChunk removes the group from the scene and releases materials", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    expect(group).toBeDefined();
    expect(scene.children).toContain(group);
    queue.evictChunk(job.chunkId);
    expect(scene.children).not.toContain(group);
    expect(queue.getChunkGroup(job.chunkId)).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Scene integration
  // ---------------------------------------------------------------------------

  it("adds the uploaded group to the scene", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    expect(group).toBeDefined();
    expect(scene.children).toContain(group);
  });

  it("uploaded group contains a mesh", () => {
    const _id = makeChunkId(0, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    expect(group?.children.length).toBeGreaterThan(0);
    expect(group?.children[0]).toBeInstanceOf(Mesh);
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  it("dispose removes all uploaded groups and releases resources", () => {
    const _id1 = makeChunkId(0, 0);
    const _id2 = makeChunkId(1, 0);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
      { cx: 1, cy: 0, plane: 0 },
    ]);
    const job1 = expectDequeueJob(chunkBakeQueue);
    const job2 = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(
      job1.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.enqueueBakedChunk(
      job2.chunkId,
      makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
    );
    queue.processFrame(0, () => 0);
    queue.processFrame(0, () => 0);
    expect(scene.children.length).toBeGreaterThanOrEqual(2);
    queue.dispose();
    expect(scene.children.length).toBe(0);
    expect(queue.getChunkGroup(job1.chunkId)).toBeUndefined();
    expect(queue.getChunkGroup(job2.chunkId)).toBeUndefined();
  });

  it("dispose is idempotent", () => {
    queue.dispose();
    queue.dispose();
    expect(true).toBe(true);
  });

  it("throws after dispose", () => {
    queue.dispose();
    expect(() =>
      queue.enqueueBakedChunk(
        makeChunkId(0, 0),
        makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]),
      ),
    ).toThrow("ChunkUploadQueue has been disposed.");
  });

  it("throws when processFrame is called after dispose", () => {
    queue.dispose();
    expect(() => queue.processFrame(0)).toThrow("ChunkUploadQueue has been disposed.");
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("handles empty material groups with a fallback material", () => {
    const _id = makeChunkId(0, 0);
    const payload = makePayload([], 4);
    chunkBakeQueue.ingestRegionLoad("0:0:0" as import("@old-town/shared").RegionId, [
      { cx: 0, cy: 0, plane: 0 },
    ]);
    const job = expectDequeueJob(chunkBakeQueue);
    queue.enqueueBakedChunk(job.chunkId, payload);
    queue.processFrame(0, () => 0);
    const group = queue.getChunkGroup(job.chunkId);
    const mesh = group?.children[0] as Mesh;
    expect(mesh.material).toBeDefined();
  });

  it("ignores already-uploaded or failed items in queue during processFrame", () => {
    const id = makeChunkId(0, 0);
    queue.enqueueBakedChunk(id, makePayload([{ materialId: "grass", startIndex: 0, count: 3 }]));
    // Manually mutate state to uploaded
    const internal = (queue as unknown as { _queue: QueuedChunkUpload[] })._queue;
    const entry = internal[0];
    expect(entry).toBeDefined();
    (entry as QueuedChunkUpload).state = "uploaded";
    queue.processFrame(0, () => 0);
    expect(queue.stats().totalUploads).toBe(0);
  });

  it("processFrame with no queued items is a no-op", () => {
    queue.processFrame(0, () => 0);
    expect(queue.stats().totalUploads).toBe(0);
    expect(queue.stats().queueDepth).toBe(0);
  });
});

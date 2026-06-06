import { CHUNK_SIZE, type ChunkId, chunkId, type RegionId, type TileCoord } from "@old-town/shared";

export type ChunkLifecycleState =
  | "unseen"
  | "metadata_loaded"
  | "bake_requested"
  | "baking_worker"
  | "retry_pending"
  | "baked_waiting_gpu_upload"
  | "gpu_resident"
  | "visible"
  | "hidden_resident"
  | "evict_pending"
  | "disposed";

export interface ChunkMetadata {
  readonly cx: number;
  readonly cy: number;
  readonly plane: number;
}

export interface ChunkBakePriority {
  /** Distance from focus tile to chunk center (in tiles). */
  readonly distance: number;
  /** True if the chunk is currently required to be visible. */
  readonly visibilityRequired: boolean;
  /** Number of times this bake has been retried. */
  readonly retryCount: number;
}

export interface ChunkBakeJob {
  readonly chunkId: ChunkId;
  readonly regionId: RegionId;
  readonly priority: ChunkBakePriority;
  /** Monotonic sequence for deterministic tie-breaking. */
  readonly sequence: number;
  /** Frame after which this retry may be attempted. */
  readonly retryAfterFrame: number;
}

export interface ChunkBakeQueueStats {
  /** Chunks in `bake_requested` state. */
  queued: number;
  /** Chunks in `baking_worker` state. */
  baking: number;
  /** Chunks in `retry_pending` state. */
  retryPending: number;
  /** Chunks in `baked_waiting_gpu_upload` state. */
  waitingUpload: number;
  /** Chunks in `gpu_resident`, `visible`, or `hidden_resident` state. */
  resident: number;
  /** Chunks in `visible` state. */
  visible: number;
  /** Chunks in `hidden_resident` state. */
  hiddenResident: number;
  /** Chunks in `evict_pending` state. */
  evictPending: number;
  /** Chunks in `disposed` state. */
  disposed: number;
  /** Chunks that exceeded max retries and are permanently failed. */
  failed: number;
}

interface ChunkRecord {
  chunkId: ChunkId;
  regionId: RegionId;
  state: ChunkLifecycleState;
  metadata: ChunkMetadata | null;
  retryCount: number;
  retryAfterFrame: number;
  sequence: number;
  isVisible: boolean;
  job: ChunkBakeJob | null;
}

const MAX_BAKE_RETRIES = 3;

function computeChunkDistance(chunk: ChunkMetadata, focus: TileCoord): number {
  const centerX = chunk.cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerY = chunk.cy * CHUNK_SIZE + CHUNK_SIZE / 2;
  const dx = focus.x - centerX;
  const dy = focus.y - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

function makePriority(
  chunk: ChunkMetadata,
  focus: TileCoord | null,
  isVisible: boolean,
  retryCount: number,
): ChunkBakePriority {
  const distance = focus ? computeChunkDistance(chunk, focus) : Infinity;
  return {
    distance,
    visibilityRequired: isVisible,
    retryCount,
  };
}

function comparePriority(
  a: ChunkBakePriority,
  b: ChunkBakePriority,
  seqA: number,
  seqB: number,
): number {
  // Higher visibility first
  if (a.visibilityRequired !== b.visibilityRequired) {
    return a.visibilityRequired ? -1 : 1;
  }
  // Closer distance first
  if (a.distance !== b.distance) {
    return a.distance - b.distance;
  }
  // Fewer retries first
  if (a.retryCount !== b.retryCount) {
    return a.retryCount - b.retryCount;
  }
  // Deterministic tie-break by sequence
  return seqA - seqB;
}

/**
 * Pure chunk lifecycle state machine and bake queue.
 *
 * No Three.js imports.  Region load packets enqueue work; the queue
 * orders jobs by visibility, distance, and retry count, and tracks every
 * lifecycle transition from `unseen` through `disposed`.
 */
export class ChunkBakeQueue {
  private readonly _chunks = new Map<ChunkId, ChunkRecord>();
  private readonly _regionChunks = new Map<RegionId, Set<ChunkId>>();
  private readonly _queue: ChunkBakeJob[] = [];
  private readonly _failed = new Set<ChunkId>();
  private _focusTile: TileCoord | null = null;
  private _sequence = 0;

  /** Update the focus tile used for distance-based priority. */
  setFocusTile(tile: TileCoord | null): void {
    this._focusTile = tile;
  }

  /** Update the visibility flag for a chunk. */
  setChunkVisibility(chunkId: ChunkId, visible: boolean): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    record.isVisible = visible;
  }

  /**
   * Ingest a region load payload.  Creates or updates chunk metadata and
   * queues bake jobs.  Never touches WebGL or Three.js.
   */
  ingestRegionLoad(regionId: RegionId, chunks: ChunkMetadata[]): void {
    const regionSet = this._regionChunks.get(regionId) ?? new Set<ChunkId>();
    this._regionChunks.set(regionId, regionSet);

    for (const metadata of chunks) {
      const id = chunkId({
        cx: metadata.cx,
        cy: metadata.cy,
        plane: metadata.plane as 0 | 1 | 2 | 3,
      });

      if (!regionSet.has(id)) {
        regionSet.add(id);
      }

      const existing = this._chunks.get(id);
      if (existing) {
        // If chunk was tracked under a different region, remove from old set.
        if (existing.regionId !== regionId) {
          const oldSet = this._regionChunks.get(existing.regionId);
          if (oldSet) {
            oldSet.delete(id);
          }
        }
        existing.metadata = metadata;
        existing.regionId = regionId;
        if (existing.state === "disposed") {
          existing.state = "unseen";
          existing.retryCount = 0;
          existing.retryAfterFrame = 0;
          existing.isVisible = false;
          existing.job = null;
          this._failed.delete(id);
        }
      } else {
        this._chunks.set(id, {
          chunkId: id,
          regionId,
          state: "unseen",
          metadata,
          retryCount: 0,
          retryAfterFrame: 0,
          sequence: 0,
          isVisible: false,
          job: null,
        });
      }

      const record = this._chunks.get(id)!;
      if (record.state === "unseen") {
        record.state = "metadata_loaded";
      }
      if (record.state === "metadata_loaded") {
        record.state = "bake_requested";
        this._enqueueBake(record);
      }
    }
  }

  /**
   * Ingest a region unload payload.  GPU-resident chunks are marked
   * `evict_pending`; non-resident chunks are marked `disposed`.  Queued
   * bake jobs are cancelled.
   */
  ingestRegionUnload(regionId: RegionId): void {
    const regionSet = this._regionChunks.get(regionId);
    if (!regionSet) return;

    for (const id of regionSet) {
      const record = this._chunks.get(id);
      if (!record) continue;

      switch (record.state) {
        case "visible":
        case "gpu_resident":
        case "hidden_resident":
          record.state = "evict_pending";
          record.isVisible = false;
          break;
        case "bake_requested":
          this._cancelJob(record);
          record.state = "disposed";
          break;
        case "baking_worker":
          record.state = "disposed";
          break;
        case "baked_waiting_gpu_upload":
          record.state = "disposed";
          break;
        case "metadata_loaded":
          record.state = "disposed";
          break;
        case "unseen":
          record.state = "disposed";
          break;
        case "evict_pending":
          // already pending
          break;
        case "disposed":
          // already disposed
          break;
      }
    }

    this._regionChunks.delete(regionId);
  }

  /**
   * Remove the highest-priority bake job from the queue and transition it
   * to `baking_worker`.  Returns `null` when the queue is empty.
   */
  dequeueJob(): ChunkBakeJob | null {
    this._removeStaleJobs();
    if (this._queue.length === 0) return null;

    this._refreshPriorities();
    this._queue.sort((a, b) => comparePriority(a.priority, b.priority, a.sequence, b.sequence));

    const job = this._queue.shift()!;
    const record = this._chunks.get(job.chunkId);
    if (!record || record.state !== "bake_requested") {
      return this.dequeueJob();
    }

    record.state = "baking_worker";
    record.job = job;
    return job;
  }

  /** Signal that a worker has successfully baked a chunk. */
  onWorkerComplete(chunkId: ChunkId): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    if (record.state === "baking_worker") {
      record.state = "baked_waiting_gpu_upload";
    }
  }

  /** Signal that a worker has failed to bake a chunk. */
  onWorkerFailed(chunkId: ChunkId, retryAfterFrame = 0): void {
    const record = this._chunks.get(chunkId);
    if (!record || record.state !== "baking_worker") return;

    record.retryCount++;
    if (record.retryCount > MAX_BAKE_RETRIES) {
      record.state = "disposed";
      this._failed.add(chunkId);
    } else {
      if (retryAfterFrame > 0) {
        record.state = "retry_pending";
        record.retryAfterFrame = retryAfterFrame;
      } else {
        record.state = "bake_requested";
        this._enqueueBake(record);
      }
    }
  }

  /** Transition any `retry_pending` chunks to `bake_requested` when their frame is due. */
  processRetries(currentFrame: number): void {
    for (const record of this._chunks.values()) {
      if (record.state === "retry_pending" && record.retryAfterFrame <= currentFrame) {
        record.state = "bake_requested";
        this._enqueueBake(record);
      }
    }
  }

  /** Invalidate all resident chunks so they are re-baked and re-uploaded. */
  invalidateAllResident(): void {
    for (const record of this._chunks.values()) {
      if (
        record.state === "visible" ||
        record.state === "hidden_resident" ||
        record.state === "gpu_resident"
      ) {
        record.state = "metadata_loaded";
        record.retryCount = 0;
        record.retryAfterFrame = 0;
        this._failed.delete(record.chunkId);
        record.state = "bake_requested";
        this._enqueueBake(record);
      }
    }
  }

  /** Signal that GPU upload has completed for a chunk. */
  onGpuUploadComplete(chunkId: ChunkId): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    if (record.state === "baked_waiting_gpu_upload") {
      record.state = "gpu_resident";
    }
  }

  /** Mark a chunk as visible (add to the scene graph). */
  markVisible(chunkId: ChunkId): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    record.isVisible = true;
    if (
      record.state === "gpu_resident" ||
      record.state === "hidden_resident" ||
      record.state === "evict_pending"
    ) {
      record.state = "visible";
    }
  }

  /** Mark a chunk as hidden (remove from scene but keep GPU-resident). */
  markHidden(chunkId: ChunkId): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    record.isVisible = false;
    if (record.state === "visible" || record.state === "gpu_resident") {
      record.state = "hidden_resident";
    }
  }

  /** Mark a chunk as evict pending (GPU eviction will follow). */
  markEvictPending(chunkId: ChunkId): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    if (
      record.state === "visible" ||
      record.state === "gpu_resident" ||
      record.state === "hidden_resident"
    ) {
      record.state = "evict_pending";
      record.isVisible = false;
    }
  }

  /** Signal that GPU eviction has completed for a chunk. */
  onEvictComplete(chunkId: ChunkId): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    if (record.state === "evict_pending") {
      record.state = "disposed";
    }
  }

  /** Snapshot of current queue and residency counts. */
  getStats(): ChunkBakeQueueStats {
    let queued = 0;
    let baking = 0;
    let retryPending = 0;
    let waitingUpload = 0;
    let resident = 0;
    let visible = 0;
    let hiddenResident = 0;
    let evictPending = 0;
    let disposed = 0;

    for (const record of this._chunks.values()) {
      switch (record.state) {
        case "bake_requested":
          queued++;
          break;
        case "baking_worker":
          baking++;
          break;
        case "retry_pending":
          retryPending++;
          break;
        case "baked_waiting_gpu_upload":
          waitingUpload++;
          break;
        case "gpu_resident":
          resident++;
          break;
        case "visible":
          visible++;
          resident++;
          break;
        case "hidden_resident":
          hiddenResident++;
          resident++;
          break;
        case "evict_pending":
          evictPending++;
          break;
        case "disposed":
          disposed++;
          break;
      }
    }

    return {
      queued,
      baking,
      retryPending,
      waitingUpload,
      resident,
      visible,
      hiddenResident,
      evictPending,
      disposed,
      failed: this._failed.size,
    };
  }

  private _enqueueBake(record: ChunkRecord): void {
    if (record.state !== "bake_requested" || !record.metadata) return;
    record.sequence = ++this._sequence;
    const priority = makePriority(
      record.metadata,
      this._focusTile,
      record.isVisible,
      record.retryCount,
    );
    const job: ChunkBakeJob = {
      chunkId: record.chunkId,
      regionId: record.regionId,
      priority,
      sequence: record.sequence,
      retryAfterFrame: record.retryAfterFrame,
    };
    record.job = job;
    this._queue.push(job);
  }

  private _cancelJob(record: ChunkRecord): void {
    const idx = this._queue.findIndex((j) => j.chunkId === record.chunkId);
    if (idx >= 0) {
      this._queue.splice(idx, 1);
    }
    record.job = null;
  }

  private _refreshPriorities(): void {
    for (const job of this._queue) {
      const record = this._chunks.get(job.chunkId);
      if (record && record.metadata) {
        (job as unknown as { priority: ChunkBakePriority }).priority = makePriority(
          record.metadata,
          this._focusTile,
          record.isVisible,
          record.retryCount,
        );
      }
    }
  }

  private _removeStaleJobs(): void {
    for (let i = this._queue.length - 1; i >= 0; i--) {
      const job = this._queue[i];
      if (!job) continue;
      const record = this._chunks.get(job.chunkId);
      if (!record || record.state !== "bake_requested") {
        this._queue.splice(i, 1);
      }
    }
  }
}

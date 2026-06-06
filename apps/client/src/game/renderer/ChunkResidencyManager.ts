import { CHUNK_SIZE, type ChunkId, chunkId, type RegionId, type TileCoord } from "@old-town/shared";
import type { ChunkBakeQueue, ChunkLifecycleState, ChunkMetadata } from "./ChunkBakeQueue";
import type { ChunkUploadQueue } from "./ChunkUploadQueue";

/** Constructor options for ChunkResidencyManager. */
export interface ChunkResidencyOptions {
  readonly chunkBakeQueue: ChunkBakeQueue;
  readonly chunkUploadQueue: ChunkUploadQueue;
  /** Distance in tiles within which a chunk is visible. */
  readonly visibleRadiusTiles: number;
  /** Distance in tiles within which a chunk is kept resident. */
  readonly residentRadiusTiles: number;
  /** Approximate GPU memory budget in bytes. */
  readonly maxGpuBytes: number;
  /** Optional callback to release instance buckets when a chunk is disposed. */
  readonly onDisposeChunk?: (chunkId: ChunkId) => void;
}

/** Snapshot of residency diagnostics. */
export interface ChunkResidencyStats {
  readonly visible: number;
  readonly hiddenResident: number;
  readonly evictPending: number;
  readonly disposed: number;
  readonly approximateGpuBytes: number;
}

/** Deterministic action for a chunk this frame. */
export type ChunkVisibilityDecision = "show" | "hide" | "evict" | "noop";

interface ChunkResidencyRecord {
  readonly chunkId: ChunkId;
  regionId: RegionId;
  metadata: ChunkMetadata;
  state: ChunkLifecycleState;
  distance: number;
  lastVisibleFrame: number;
  lastAccessedFrame: number;
  approximateGpuBytes: number;
  disposedOnce: boolean;
}

/**
 * Orchestrates chunk visibility, hidden-resident retention, LRU eviction,
 * and memory-pressure disposal.
 *
 * The manager is deterministic: for a given focus tile and frame id, the
 * same visibility decisions and eviction order are produced every time.
 */
export class ChunkResidencyManager {
  private readonly _chunkBakeQueue: ChunkBakeQueue;
  private readonly _chunkUploadQueue: ChunkUploadQueue;
  private readonly _visibleRadius: number;
  private readonly _residentRadius: number;
  private readonly _maxGpuBytes: number;
  private readonly _onDisposeChunk: ((chunkId: ChunkId) => void) | undefined;
  private readonly _chunks = new Map<ChunkId, ChunkResidencyRecord>();
  private readonly _regionChunks = new Map<RegionId, Set<ChunkId>>();
  private _focusTile: TileCoord | null = null;
  private _stats: ChunkResidencyStats;

  constructor(options: ChunkResidencyOptions) {
    this._chunkBakeQueue = options.chunkBakeQueue;
    this._chunkUploadQueue = options.chunkUploadQueue;
    this._visibleRadius = options.visibleRadiusTiles;
    this._residentRadius = options.residentRadiusTiles;
    this._maxGpuBytes = options.maxGpuBytes;
    this._onDisposeChunk = options.onDisposeChunk;
    this._stats = this._makeEmptyStats();
  }

  /** Set the current focus tile (camera / player position). */
  setFocusTile(tile: TileCoord | null): void {
    this._focusTile = tile;
    this._chunkBakeQueue.setFocusTile(tile);
  }

  /** Ingest a region load payload and start tracking the chunks. */
  ingestRegionLoad(regionId: RegionId, chunks: ChunkMetadata[]): void {
    this._chunkBakeQueue.ingestRegionLoad(regionId, chunks);
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
      this._registerChunkInternal(id, regionId, metadata);
    }
    this._recomputeStats();
  }

  /** Ingest a region unload payload. */
  ingestRegionUnload(regionId: RegionId): void {
    this._chunkBakeQueue.ingestRegionUnload(regionId);
    const regionSet = this._regionChunks.get(regionId);
    if (regionSet) {
      for (const id of regionSet) {
        const record = this._chunks.get(id);
        if (record) {
          this._transitionToEvict(record, -1);
        }
      }
      this._regionChunks.delete(regionId);
    }
    this._recomputeStats();
  }

  /** Register a chunk that has completed GPU upload and is now resident. */
  onGpuResident(chunkId: ChunkId, approximateGpuBytes: number): void {
    const record = this._chunks.get(chunkId);
    if (!record) return;
    if (record.state === "disposed") return;
    record.approximateGpuBytes = approximateGpuBytes;
    record.state = "gpu_resident";
  }

  /**
   * Evaluate all chunks for this frame and apply visibility / eviction
   * transitions. Deterministic for a given focus tile and frame id.
   */
  evaluate(frameId: number): void {
    if (!this._focusTile) return;

    // Compute distances once.
    for (const record of this._chunks.values()) {
      record.distance = this._computeDistance(record.metadata);
    }

    // Apply distance-based transitions.
    for (const record of this._chunks.values()) {
      const decision = this._decide(record);
      switch (decision) {
        case "show":
          this._transitionToVisible(record, frameId);
          break;
        case "hide":
          this._transitionToHidden(record, frameId);
          break;
        case "evict":
          this._transitionToEvict(record, frameId);
          break;
        case "noop":
          break;
      }
    }

    // Evict additional hidden-resident chunks when the memory budget is exceeded.
    this._evictForMemoryBudget(frameId);

    // Update access timestamps for chunks that remain resident.
    for (const record of this._chunks.values()) {
      if (record.state === "visible" || record.state === "hidden_resident") {
        record.lastAccessedFrame = frameId;
      }
      if (record.state === "visible") {
        record.lastVisibleFrame = frameId;
      }
    }

    this._recomputeStats();
  }

  /** Return current residency stats. */
  getStats(): ChunkResidencyStats {
    return { ...this._stats };
  }

  /** Return the visibility decision for a specific chunk (for debugging / tests). */
  getDecision(chunkId: ChunkId, _frameId: number): ChunkVisibilityDecision {
    const record = this._chunks.get(chunkId);
    if (!record) return "noop";
    if (!this._focusTile) return "noop";
    record.distance = this._computeDistance(record.metadata);
    return this._decide(record);
  }

  /** Return the current lifecycle state for a tracked chunk, or undefined. */
  getChunkState(chunkId: ChunkId): ChunkLifecycleState | undefined {
    return this._chunks.get(chunkId)?.state;
  }

  /** Return the metadata for a tracked chunk, or undefined. */
  getChunkMetadata(chunkId: ChunkId): ChunkMetadata | undefined {
    return this._chunks.get(chunkId)?.metadata;
  }

  /** Iterate over all tracked chunks. */
  forEachChunk(
    callback: (chunkId: ChunkId, state: ChunkLifecycleState, metadata: ChunkMetadata) => void,
  ): void {
    for (const record of this._chunks.values()) {
      callback(record.chunkId, record.state, record.metadata);
    }
  }

  /** Return all tracked chunk IDs. */
  getAllChunkIds(): ChunkId[] {
    return Array.from(this._chunks.keys());
  }

  /** Reset all resident chunks to unseen so they are re-baked after context loss. */
  invalidateAllResident(): void {
    for (const record of this._chunks.values()) {
      if (
        record.state === "visible" ||
        record.state === "hidden_resident" ||
        record.state === "gpu_resident"
      ) {
        record.state = "unseen";
        record.approximateGpuBytes = 0;
        record.disposedOnce = false;
      }
    }
    this._recomputeStats();
  }

  /** Dispose all tracked chunks and evict their GPU resources. */
  dispose(): void {
    for (const record of this._chunks.values()) {
      if (record.state !== "disposed" && record.state !== "evict_pending") {
        this._transitionToEvict(record, -1);
      }
    }
    this._chunks.clear();
    this._stats = this._makeEmptyStats();
  }

  private _registerChunkInternal(
    chunkId: ChunkId,
    regionId: RegionId,
    metadata: ChunkMetadata,
  ): void {
    const existing = this._chunks.get(chunkId);
    if (existing) {
      existing.metadata = metadata;
      existing.regionId = regionId;
      if (existing.state === "disposed") {
        // Re-entering a disposed chunk: reset for a fresh bake.
        existing.state = "unseen";
        existing.approximateGpuBytes = 0;
        existing.disposedOnce = false;
      }
    } else {
      this._chunks.set(chunkId, {
        chunkId,
        regionId,
        metadata,
        state: "unseen",
        distance: Infinity,
        lastVisibleFrame: -1,
        lastAccessedFrame: -1,
        approximateGpuBytes: 0,
        disposedOnce: false,
      });
    }
  }

  private _computeDistance(metadata: ChunkMetadata): number {
    if (!this._focusTile) return Infinity;
    const centerX = metadata.cx * CHUNK_SIZE + CHUNK_SIZE / 2;
    const centerY = metadata.cy * CHUNK_SIZE + CHUNK_SIZE / 2;
    const dx = this._focusTile.x - centerX;
    const dy = this._focusTile.y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private _decide(record: ChunkResidencyRecord): ChunkVisibilityDecision {
    const insideVisible = record.distance <= this._visibleRadius;
    const insideResident = record.distance <= this._residentRadius;

    switch (record.state) {
      case "gpu_resident":
        if (insideVisible) return "show";
        if (insideResident) return "hide";
        return "evict";
      case "visible":
        if (insideVisible) return "noop";
        if (insideResident) return "hide";
        return "evict";
      case "hidden_resident":
        if (insideVisible) return "show";
        if (insideResident) return "noop";
        return "evict";
      default:
        return "noop";
    }
  }

  private _transitionToVisible(record: ChunkResidencyRecord, _frameId: number): void {
    if (record.state === "visible") return;
    record.state = "visible";
    this._chunkBakeQueue.markVisible(record.chunkId);
  }

  private _transitionToHidden(record: ChunkResidencyRecord, _frameId: number): void {
    if (record.state === "hidden_resident") return;
    record.state = "hidden_resident";
    this._chunkBakeQueue.markHidden(record.chunkId);
  }

  private _transitionToEvict(record: ChunkResidencyRecord, _frameId: number): void {
    if (record.state === "evict_pending" || record.state === "disposed") return;
    if (record.disposedOnce) return;

    record.state = "evict_pending";
    this._chunkBakeQueue.markEvictPending(record.chunkId);
    this._chunkUploadQueue.evictChunk(record.chunkId);
    if (this._onDisposeChunk) {
      this._onDisposeChunk(record.chunkId);
    }
    record.disposedOnce = true;
    this._chunkBakeQueue.onEvictComplete(record.chunkId);
    record.state = "disposed";
  }

  private _evictForMemoryBudget(frameId: number): void {
    const residentBytes = this._sumResidentBytes();
    if (residentBytes <= this._maxGpuBytes) return;

    const hidden = Array.from(this._chunks.values()).filter((r) => r.state === "hidden_resident");

    // LRU eviction tie-breakers:
    // 1. Oldest lastAccessedFrame (ascending) — least recently used first.
    // 2. Farthest distance (descending) — spatially distant first.
    // 3. ChunkId (ascending) — deterministic string tie-breaker.
    hidden.sort((a, b) => {
      if (a.lastAccessedFrame !== b.lastAccessedFrame) {
        return a.lastAccessedFrame - b.lastAccessedFrame;
      }
      if (a.distance !== b.distance) {
        return b.distance - a.distance;
      }
      return a.chunkId.localeCompare(b.chunkId);
    });

    let bytesToEvict = residentBytes - this._maxGpuBytes;
    for (const record of hidden) {
      if (bytesToEvict <= 0) break;
      this._transitionToEvict(record, frameId);
      bytesToEvict -= record.approximateGpuBytes;
    }
  }

  private _sumResidentBytes(): number {
    let sum = 0;
    for (const record of this._chunks.values()) {
      if (record.state === "visible" || record.state === "hidden_resident") {
        sum += record.approximateGpuBytes;
      }
    }
    return sum;
  }

  private _recomputeStats(): void {
    let visible = 0;
    let hiddenResident = 0;
    let evictPending = 0;
    let disposed = 0;
    let gpuBytes = 0;

    for (const record of this._chunks.values()) {
      switch (record.state) {
        case "visible":
          visible++;
          gpuBytes += record.approximateGpuBytes;
          break;
        case "hidden_resident":
          hiddenResident++;
          gpuBytes += record.approximateGpuBytes;
          break;
        case "evict_pending":
          evictPending++;
          break;
        case "disposed":
          disposed++;
          break;
      }
    }

    this._stats = {
      visible,
      hiddenResident,
      evictPending,
      disposed,
      approximateGpuBytes: gpuBytes,
    };
  }

  private _makeEmptyStats(): ChunkResidencyStats {
    return {
      visible: 0,
      hiddenResident: 0,
      evictPending: 0,
      disposed: 0,
      approximateGpuBytes: 0,
    };
  }
}

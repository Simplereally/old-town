import {
  CHUNKS_PER_REGION,
  type ChunkId,
  type Plane,
  REGION_SIZE,
  type RegionId,
  regionId,
  type TileCoord,
} from "@old-town/shared";
import { Scene } from "three";
import { ChunkBakeQueue, type ChunkBakeQueueStats, type ChunkMetadata } from "../ChunkBakeQueue";
import type { BakedChunkPayload } from "../ChunkBakeWorkerClient";
import { ChunkResidencyManager, type ChunkResidencyStats } from "../ChunkResidencyManager";
import {
  type ChunkUploadBudget,
  ChunkUploadQueue,
  type ChunkUploadStats,
} from "../ChunkUploadQueue";
import { RenderResourceRegistry } from "../RenderResourceRegistry";

/** Diagnostics captured for every simulated frame. */
export interface HarnessDiagnostics {
  readonly frameId: number;
  readonly focusTile: TileCoord;
  readonly residencyStats: ChunkResidencyStats;
  readonly bakeStats: ChunkBakeQueueStats;
  readonly uploadStats: ChunkUploadStats;
  /** Number of active bakes in flight at end of this frame. */
  readonly bakesInFlight: number;
  /** Whether the upload budget was treated as exhausted this frame. */
  readonly uploadExhausted: boolean;
}

/** Options for the region-crossing stress harness. */
export interface RegionCrossingHarnessOptions {
  /** Client visible radius in tiles (default 48). */
  readonly visibleRadiusTiles?: number;
  /** Client resident radius in tiles (default 96). */
  readonly residentRadiusTiles?: number;
  /** GPU memory budget in bytes (default 1_000_000). */
  readonly maxGpuBytes?: number;
  /** Upload budget per frame (default 2ms / 1 chunk). */
  readonly uploadBudget?: ChunkUploadBudget;
  /** Server region load radius in tiles (default 128). */
  readonly serverLoadRadiusTiles?: number;
  /** Max frames to delay or advance load/unload packets (default 2). */
  readonly jitterFrames?: number;
  /** Simulated worker bake latency in frames (default 2). */
  readonly bakeLatencyFrames?: number;
  /** Whether to complete worker bakes out of order (default true). */
  readonly outOfOrderCompletion?: boolean;
  /** Number of consecutive frames to simulate upload budget exhaustion (default 3). */
  readonly uploadBudgetExhaustionFrames?: number;
  /** Frame index at which upload exhaustion begins (default 12). */
  readonly exhaustionStartFrame?: number;
  /** Maximum concurrent bakes in flight (default 4). */
  readonly maxConcurrentBakes?: number;
}

interface PendingBake {
  readonly chunkId: ChunkId;
  readonly regionId: RegionId;
  readonly readyFrame: number;
}

interface PendingLoad {
  readonly targetFrame: number;
  readonly regionId: RegionId;
  readonly chunks: ChunkMetadata[];
}

interface PendingUnload {
  readonly targetFrame: number;
  readonly regionId: RegionId;
}

function makeBakedChunkPayload(materialId = "grass"): BakedChunkPayload {
  const positions = new Float32Array([0, 0, 0]);
  const normals = new Float32Array([0, 1, 0]);
  const colors = new Float32Array([1, 1, 1]);
  const indices = new Uint32Array([0]);
  return {
    positions,
    normals,
    colors,
    indices,
    materialGroups: [{ startIndex: 0, count: 1, materialId }],
    bounds: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
    tileMetadata: [],
    collisionDebugData: [],
    objectInstanceDescriptors: [],
  };
}

function deterministicShuffle<T>(arr: T[], seed: number): void {
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
}

/**
 * Stress harness that simulates a deterministic player path crossing multiple
 * region boundaries, with jittered region load/unload packets, out-of-order
 * worker bake completions, and upload budget exhaustion.
 *
 * Does not require a real WebGL context.
 */
export class RegionCrossingHarness {
  private readonly _residencyManager: ChunkResidencyManager;
  private readonly _bakeQueue: ChunkBakeQueue;
  private readonly _uploadQueue: ChunkUploadQueue;
  private readonly _path: TileCoord[];
  private readonly _visibleRadius: number;
  private readonly _residentRadius: number;
  private readonly _maxGpuBytes: number;
  private readonly _serverLoadRadiusTiles: number;
  private readonly _jitterFrames: number;
  private readonly _bakeLatencyFrames: number;
  private readonly _outOfOrderCompletion: boolean;
  private readonly _uploadBudgetExhaustionFrames: number;
  private readonly _exhaustionStartFrame: number;
  private readonly _maxConcurrentBakes: number;

  private _frameId = 0;
  private _stepIndex = 0;
  private _deterministicSeed = 12345;
  private readonly _pendingLoads: PendingLoad[] = [];
  private readonly _pendingUnloads: PendingUnload[] = [];
  private readonly _loadedRegions = new Set<RegionId>();
  private readonly _bakingJobs: PendingBake[] = [];
  private readonly _diagnostics: HarnessDiagnostics[] = [];

  constructor(options: RegionCrossingHarnessOptions = {}) {
    this._visibleRadius = options.visibleRadiusTiles ?? 48;
    this._residentRadius = options.residentRadiusTiles ?? 96;
    this._maxGpuBytes = options.maxGpuBytes ?? 1_000_000;
    this._serverLoadRadiusTiles = options.serverLoadRadiusTiles ?? 128;
    this._jitterFrames = options.jitterFrames ?? 2;
    this._bakeLatencyFrames = options.bakeLatencyFrames ?? 2;
    this._outOfOrderCompletion = options.outOfOrderCompletion ?? true;
    this._uploadBudgetExhaustionFrames = options.uploadBudgetExhaustionFrames ?? 3;
    this._exhaustionStartFrame = options.exhaustionStartFrame ?? 12;
    this._maxConcurrentBakes = options.maxConcurrentBakes ?? 16;

    const scene = new Scene();
    const registry = new RenderResourceRegistry();
    this._bakeQueue = new ChunkBakeQueue();
    this._uploadQueue = new ChunkUploadQueue({
      scene,
      registry,
      chunkBakeQueue: this._bakeQueue,
      budget: options.uploadBudget ?? { maxMsPerFrame: 1000, maxChunksPerFrame: 16 },
    });
    this._residencyManager = new ChunkResidencyManager({
      chunkBakeQueue: this._bakeQueue,
      chunkUploadQueue: this._uploadQueue,
      visibleRadiusTiles: this._visibleRadius,
      residentRadiusTiles: this._residentRadius,
      maxGpuBytes: this._maxGpuBytes,
    });

    this._path = this._generatePath();
  }

  /** Advance the simulation by one frame. */
  tick(): void {
    if (this._stepIndex >= this._path.length) return;

    const focusTile = this._path[this._stepIndex];
    if (!focusTile) return;
    this._stepIndex++;
    this._frameId++;

    // 1. Update focus.
    this._residencyManager.setFocusTile(focusTile);
    this._bakeQueue.setFocusTile(focusTile);

    // 2. Generate region load/unload with jitter.
    const desiredRegions = this._regionsInServerRadius(focusTile);
    const desiredSet = new Set(desiredRegions);

    for (const rid of desiredRegions) {
      if (!this._loadedRegions.has(rid)) {
        const jitter = this._nextJitter();
        this._pendingLoads.push({
          targetFrame: this._frameId + jitter,
          regionId: rid,
          chunks: this._generateRegionChunks(rid),
        });
        this._loadedRegions.add(rid);
      }
    }

    for (const rid of Array.from(this._loadedRegions)) {
      if (!desiredSet.has(rid)) {
        const jitter = this._nextJitter();
        this._pendingUnloads.push({
          targetFrame: this._frameId + jitter,
          regionId: rid,
        });
        this._loadedRegions.delete(rid);
      }
    }

    // 3. Apply pending loads/unloads whose target frame has arrived.
    this._applyPendingLoads();
    this._applyPendingUnloads();

    // 4. Evaluate residency.
    this._residencyManager.evaluate(this._frameId);

    // 5. Simulate worker bake queue.
    this._processBakeQueue();

    // 6. Simulate out-of-order worker completions.
    this._processWorkerCompletions();

    // 7. Simulate upload budget exhaustion.
    const uploadExhausted =
      this._frameId >= this._exhaustionStartFrame &&
      this._frameId < this._exhaustionStartFrame + this._uploadBudgetExhaustionFrames;

    // 8. Process upload queue.
    const frameStart = 0;
    if (uploadExhausted) {
      // Elapsed always exceeds maxMsPerFrame so no uploads occur.
      this._uploadQueue.processFrame(frameStart, () => frameStart + 1000, this._frameId);
    } else {
      this._uploadQueue.processFrame(frameStart, () => frameStart, this._frameId);
    }

    // 9. Notify residency manager of newly uploaded chunks.
    for (const chunkId of this._residencyManager.getAllChunkIds()) {
      if (this._uploadQueue.getChunkGroup(chunkId)) {
        this._residencyManager.onGpuResident(chunkId, 1000);
      }
    }

    // 10. Re-evaluate so newly gpu-resident chunks become visible.
    this._residencyManager.evaluate(this._frameId);

    // 11. Record diagnostics.
    this._diagnostics.push({
      frameId: this._frameId,
      focusTile,
      residencyStats: this._residencyManager.getStats(),
      bakeStats: this._bakeQueue.getStats(),
      uploadStats: this._uploadQueue.stats(),
      bakesInFlight: this._bakingJobs.length,
      uploadExhausted,
    });
  }

  /** Run the full path and return all captured diagnostics. */
  runAll(): HarnessDiagnostics[] {
    while (this._stepIndex < this._path.length) {
      this.tick();
    }
    return this._diagnostics;
  }

  /** Return all captured diagnostics so far. */
  getDiagnostics(): HarnessDiagnostics[] {
    return this._diagnostics;
  }

  /** Return the residency manager (for assertions). */
  getResidencyManager(): ChunkResidencyManager {
    return this._residencyManager;
  }

  /** Return the bake queue (for assertions). */
  getBakeQueue(): ChunkBakeQueue {
    return this._bakeQueue;
  }

  /** Return the upload queue (for assertions). */
  getUploadQueue(): ChunkUploadQueue {
    return this._uploadQueue;
  }

  /** Return the generated path. */
  getPath(): readonly TileCoord[] {
    return this._path;
  }

  private _generatePath(): TileCoord[] {
    const plane: Plane = 0;
    const waypoints: Array<[number, number]> = [
      [32, 32], // region (0,0)
      [96, 32], // region (1,0) — boundary 1
      [96, 96], // region (1,1) — boundary 2
      [32, 96], // region (0,1) — boundary 3
      [32, 32], // region (0,0) — boundary 4, revisit
    ];

    const path: TileCoord[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [x1, y1] = waypoints[i] as [number, number];
      const [x2, y2] = waypoints[i + 1] as [number, number];
      const steps = 12;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        path.push({
          x: Math.round(x1 + (x2 - x1) * t),
          y: Math.round(y1 + (y2 - y1) * t),
          plane,
        });
      }
    }
    // Final destination
    const [lastX, lastY] = waypoints[waypoints.length - 1] as [number, number];
    path.push({ x: lastX, y: lastY, plane });
    return path;
  }

  private _regionsInServerRadius(tile: TileCoord): RegionId[] {
    const currentRx = Math.floor(tile.x / REGION_SIZE);
    const currentRy = Math.floor(tile.y / REGION_SIZE);
    const regionRadius = Math.ceil(this._serverLoadRadiusTiles / REGION_SIZE);
    const regions: RegionId[] = [];
    for (let dx = -regionRadius; dx <= regionRadius; dx++) {
      for (let dy = -regionRadius; dy <= regionRadius; dy++) {
        regions.push(regionId({ rx: currentRx + dx, ry: currentRy + dy, plane: tile.plane }));
      }
    }
    return regions;
  }

  private _generateRegionChunks(rid: RegionId): ChunkMetadata[] {
    const [rxStr, ryStr, planeStr] = rid.split(":");
    const rx = Number(rxStr);
    const ry = Number(ryStr);
    const plane = Number(planeStr) as Plane;
    const chunks: ChunkMetadata[] = [];
    for (let cx = rx * CHUNKS_PER_REGION; cx < (rx + 1) * CHUNKS_PER_REGION; cx++) {
      for (let cy = ry * CHUNKS_PER_REGION; cy < (ry + 1) * CHUNKS_PER_REGION; cy++) {
        chunks.push({ cx, cy, plane });
      }
    }
    return chunks;
  }

  private _nextJitter(): number {
    this._deterministicSeed = (this._deterministicSeed * 1664525 + 1013904223) >>> 0;
    const range = this._jitterFrames * 2 + 1;
    return (this._deterministicSeed % range) - this._jitterFrames;
  }

  private _applyPendingLoads(): void {
    for (let i = this._pendingLoads.length - 1; i >= 0; i--) {
      const pending = this._pendingLoads[i] as PendingLoad;
      if (pending.targetFrame <= this._frameId) {
        this._residencyManager.ingestRegionLoad(pending.regionId, pending.chunks);
        this._pendingLoads.splice(i, 1);
      }
    }
  }

  private _applyPendingUnloads(): void {
    for (let i = this._pendingUnloads.length - 1; i >= 0; i--) {
      const pending = this._pendingUnloads[i] as PendingUnload;
      if (pending.targetFrame <= this._frameId) {
        this._residencyManager.ingestRegionUnload(pending.regionId);
        this._pendingUnloads.splice(i, 1);
      }
    }
  }

  private _processBakeQueue(): void {
    const slots = this._maxConcurrentBakes - this._bakingJobs.length;
    for (let i = 0; i < slots; i++) {
      const job = this._bakeQueue.dequeueJob();
      if (!job) break;
      this._bakingJobs.push({
        chunkId: job.chunkId,
        regionId: job.regionId,
        readyFrame: this._frameId + this._bakeLatencyFrames,
      });
    }
  }

  private _processWorkerCompletions(): void {
    const ready: PendingBake[] = [];
    for (let i = this._bakingJobs.length - 1; i >= 0; i--) {
      const job = this._bakingJobs[i] as PendingBake;
      if (job.readyFrame <= this._frameId) {
        ready.push(job);
        this._bakingJobs.splice(i, 1);
      }
    }

    if (ready.length === 0) return;

    if (this._outOfOrderCompletion) {
      deterministicShuffle(ready, this._deterministicSeed);
      this._deterministicSeed = (this._deterministicSeed * 1664525 + 1013904223) >>> 0;
    }

    for (const job of ready) {
      const state = this._residencyManager.getChunkState(job.chunkId);
      if (state === "evict_pending" || state === "disposed") {
        // Skip enqueuing uploads for evicted or disposed chunks.
        continue;
      }
      this._uploadQueue.enqueueBakedChunk(job.chunkId, makeBakedChunkPayload());
    }
  }
}

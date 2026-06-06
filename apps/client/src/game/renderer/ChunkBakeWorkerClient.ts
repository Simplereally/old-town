import type { ChunkCoord, RegionId, RegionTileData } from "@old-town/shared";

export interface ObjectRef {
  readonly objectId: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotation: number;
}

export interface MaterialGroup {
  readonly startIndex: number;
  readonly count: number;
  readonly materialId: string;
}

export interface ChunkBounds {
  readonly minX: number;
  readonly minY: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly maxZ: number;
}

export interface TileMetadata {
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly underlayId: string;
  readonly overlayId: string | null;
  readonly collision: number;
}

export interface CollisionDebugData {
  readonly x: number;
  readonly y: number;
  readonly flags: number;
}

export interface ObjectInstanceDescriptor {
  readonly objectId: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotation: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly scaleZ: number;
}

export interface BakedChunkPayload {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly indices: Uint32Array;
  readonly materialGroups: readonly MaterialGroup[];
  readonly bounds: ChunkBounds;
  readonly tileMetadata: readonly TileMetadata[];
  readonly collisionDebugData: readonly CollisionDebugData[];
  readonly objectInstanceDescriptors: readonly ObjectInstanceDescriptor[];
}

export interface BakeChunkRequest {
  readonly type: "bake_chunk";
  readonly jobId: string;
  readonly regionId: RegionId;
  readonly chunkCoord: ChunkCoord;
  readonly tiles: readonly RegionTileData[];
  readonly objectRefs: readonly ObjectRef[];
  readonly requestVersion: number;
}

export interface BakeChunkSuccess {
  readonly type: "bake_chunk_success";
  readonly jobId: string;
  readonly regionId: RegionId;
  readonly chunkCoord: ChunkCoord;
  readonly payload: BakedChunkPayload;
  readonly transferables: readonly ArrayBuffer[];
}

export interface BakeChunkFailure {
  readonly type: "bake_chunk_failure";
  readonly jobId: string;
  readonly regionId: RegionId;
  readonly chunkCoord: ChunkCoord;
  readonly errorCode: string;
  readonly message: string;
}

export interface CancelBakeChunk {
  readonly type: "cancel_bake_chunk";
  readonly jobId: string;
}

export interface WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(data: unknown, transfer?: Transferable[]): void;
  terminate(): void;
}

export interface ChunkBakeWorkerClientOptions {
  poolSize?: number;
  createWorker?: () => WorkerLike;
  onSuccess: (
    jobId: string,
    regionId: RegionId,
    chunkCoord: ChunkCoord,
    payload: BakedChunkPayload,
    transferables: readonly ArrayBuffer[],
  ) => void;
  onFailure: (
    jobId: string,
    regionId: RegionId,
    chunkCoord: ChunkCoord,
    errorCode: string,
    message: string,
  ) => void;
}

export function createDefaultWorkerPoolSize(hardwareConcurrency?: number): number {
  const cores =
    hardwareConcurrency ??
    (typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : undefined);
  if (typeof cores === "number") {
    return Math.max(1, Math.min(2, cores - 1));
  }
  return 1;
}

interface JobRecord {
  readonly request: BakeChunkRequest;
  readonly worker: WorkerLike;
}

export class ChunkBakeWorkerClient {
  private readonly _workers: WorkerLike[] = [];
  private readonly _available: WorkerLike[] = [];
  private readonly _active = new Map<string, JobRecord>();
  private readonly _queue: BakeChunkRequest[] = [];
  private readonly _onSuccess: ChunkBakeWorkerClientOptions["onSuccess"];
  private readonly _onFailure: ChunkBakeWorkerClientOptions["onFailure"];
  private readonly _createWorker: () => WorkerLike;
  private _disposed = false;
  private _nextJobId = 0;

  constructor(options: ChunkBakeWorkerClientOptions) {
    this._onSuccess = options.onSuccess;
    this._onFailure = options.onFailure;
    this._createWorker = options.createWorker ?? defaultCreateWorker;
    const poolSize = options.poolSize ?? createDefaultWorkerPoolSize();

    for (let i = 0; i < poolSize; i++) {
      const worker = this._createWorker();
      worker.onmessage = (event) => this._onWorkerMessage(event);
      worker.onerror = (event) => this._onWorkerError(event, worker);
      this._workers.push(worker);
      this._available.push(worker);
    }
  }

  submit(request: Omit<BakeChunkRequest, "jobId">): string {
    this._ensureNotDisposed();
    const jobId = `job-${++this._nextJobId}`;
    const fullRequest: BakeChunkRequest = { ...request, jobId } as BakeChunkRequest;

    const worker = this._available.pop();
    if (worker) {
      this._sendJob(worker, fullRequest);
    } else {
      this._queue.push(fullRequest);
    }

    return jobId;
  }

  cancel(jobId: string): void {
    this._ensureNotDisposed();
    const queueIdx = this._queue.findIndex((r) => r.jobId === jobId);
    if (queueIdx >= 0) {
      this._queue.splice(queueIdx, 1);
      return;
    }

    const active = this._active.get(jobId);
    if (active) {
      this._active.delete(jobId);
      this._available.push(active.worker);
      const cancelMsg: CancelBakeChunk = { type: "cancel_bake_chunk", jobId };
      active.worker.postMessage(cancelMsg);
      this._drainQueue();
    }
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._queue.length = 0;
    for (const worker of this._workers) {
      worker.terminate();
    }
    this._workers.length = 0;
    this._available.length = 0;
    this._active.clear();
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error("ChunkBakeWorkerClient has been disposed.");
    }
  }

  private _sendJob(worker: WorkerLike, request: BakeChunkRequest): void {
    this._active.set(request.jobId, { request, worker });
    worker.postMessage(request);
  }

  private _onWorkerMessage(event: MessageEvent): void {
    const msg = event.data as BakeChunkSuccess | BakeChunkFailure;
    if (!msg || typeof msg.jobId !== "string") return;

    const active = this._active.get(msg.jobId);
    if (!active) return;

    this._active.delete(msg.jobId);
    this._available.push(active.worker);

    if (msg.type === "bake_chunk_success") {
      this._onSuccess(msg.jobId, msg.regionId, msg.chunkCoord, msg.payload, msg.transferables);
    } else if (msg.type === "bake_chunk_failure") {
      this._onFailure(msg.jobId, msg.regionId, msg.chunkCoord, msg.errorCode, msg.message);
    }

    this._drainQueue();
  }

  private _onWorkerError(event: ErrorEvent, worker: WorkerLike): void {
    for (const [jobId, record] of this._active) {
      if (record.worker === worker) {
        this._active.delete(jobId);
        this._available.push(record.worker);
        this._onFailure(
          jobId,
          record.request.regionId,
          record.request.chunkCoord,
          "worker_error",
          event.message || "Worker error",
        );
        break;
      }
    }
    this._drainQueue();
  }

  private _drainQueue(): void {
    while (this._queue.length > 0 && this._available.length > 0) {
      const request = this._queue.shift();
      const worker = this._available.pop();
      if (request && worker) {
        this._sendJob(worker, request);
      }
    }
  }
}

function defaultCreateWorker(): WorkerLike {
  return new Worker(new URL("./chunk-bake.worker.ts", import.meta.url), { type: "module" });
}

/** Synchronous mock worker that executes bake logic inline for Vitest environments. */
class SynchronousWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(data: unknown, _transfer?: Transferable[]): void {
    const msg = data as BakeChunkRequest | CancelBakeChunk;
    if (msg.type === "cancel_bake_chunk") {
      return;
    }
    if (msg.type === "bake_chunk") {
      const { jobId, regionId, chunkCoord } = msg;
      const positions = new Float32Array([0, 0, 0]);
      const normals = new Float32Array([0, 1, 0]);
      const colors = new Float32Array([1, 1, 1]);
      const indices = new Uint32Array([0]);

      const payload: BakedChunkPayload = {
        positions,
        normals,
        colors,
        indices,
        materialGroups: [{ startIndex: 0, count: 1, materialId: "test" }],
        bounds: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
        tileMetadata: [],
        collisionDebugData: [],
        objectInstanceDescriptors: [],
      };

      const success: BakeChunkSuccess = {
        type: "bake_chunk_success",
        jobId,
        regionId,
        chunkCoord,
        payload,
        transferables: [positions.buffer, normals.buffer, colors.buffer, indices.buffer],
      };

      if (this.onmessage) {
        this.onmessage(new MessageEvent("message", { data: success }));
      }
    }
  }

  terminate(): void {
    // no-op
  }
}

/** Convenience factory for tests that cannot instantiate real module workers. */
export function createSynchronousTestClient(
  onSuccess: ChunkBakeWorkerClientOptions["onSuccess"],
  onFailure: ChunkBakeWorkerClientOptions["onFailure"],
): ChunkBakeWorkerClient {
  return new ChunkBakeWorkerClient({
    poolSize: 1,
    createWorker: () => new SynchronousWorker(),
    onSuccess,
    onFailure,
  });
}

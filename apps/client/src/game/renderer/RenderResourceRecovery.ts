import type { ChunkId } from "@old-town/shared";
import type { ChunkBakeQueue } from "./ChunkBakeQueue";
import type { ChunkResidencyManager } from "./ChunkResidencyManager";
import type { ChunkUploadQueue } from "./ChunkUploadQueue";
import type { RenderResourceRegistry } from "./RenderResourceRegistry";

/** Canonical error codes for render resource failures. */
export type RenderResourceErrorCode =
  | "bake_failure"
  | "upload_failure"
  | "missing_material"
  | "invalid_geometry_payload"
  | "resource_disposed_use"
  | "context_loss";

/** Per-chunk failure record exposed in diagnostics. */
export interface ChunkFailureRecord {
  readonly chunkId: ChunkId;
  readonly errorCode: RenderResourceErrorCode;
  readonly message: string;
  readonly retryCount: number;
  readonly retryAfterFrame: number;
  readonly maxRetries: number;
  readonly permanent: boolean;
}

/** Debug snapshot returned by {@link RenderResourceRecovery.debugStatus}. */
export interface RenderResourceRecoveryDebug {
  readonly failedChunks: ReadonlyArray<ChunkFailureRecord>;
  readonly contextLost: boolean;
  readonly totalRetries: number;
}

/** Options for constructing a RenderResourceRecovery coordinator. */
export interface RenderResourceRecoveryOptions {
  readonly chunkBakeQueue: ChunkBakeQueue;
  readonly chunkUploadQueue: ChunkUploadQueue;
  readonly registry: RenderResourceRegistry;
  readonly residencyManager: ChunkResidencyManager;
  /** Max bake retry attempts (default 3). */
  readonly maxBakeRetries?: number;
  /** Max upload retry attempts (default 3). */
  readonly maxUploadRetries?: number;
  /** Base render-frame backoff per retry attempt (default 5). */
  readonly baseRetryBackoffFrames?: number;
}

/**
 * Coordinates failure handling, retry backoff, and WebGL context recovery.
 *
 * All failure/retry state is debug-only: it does not mutate authoritative
 * gameplay state (server truth, integer tile positions, tick timelines).
 */
export class RenderResourceRecovery {
  private readonly _chunkBakeQueue: ChunkBakeQueue;
  private readonly _chunkUploadQueue: ChunkUploadQueue;
  private readonly _registry: RenderResourceRegistry;
  private readonly _residencyManager: ChunkResidencyManager;
  private readonly _maxBakeRetries: number;
  private readonly _maxUploadRetries: number;
  private readonly _baseRetryBackoffFrames: number;
  private readonly _failures = new Map<ChunkId, ChunkFailureRecord>();
  private _contextLost = false;
  private _currentFrame = 0;
  private _totalRetries = 0;

  constructor(options: RenderResourceRecoveryOptions) {
    this._chunkBakeQueue = options.chunkBakeQueue;
    this._chunkUploadQueue = options.chunkUploadQueue;
    this._registry = options.registry;
    this._residencyManager = options.residencyManager;
    this._maxBakeRetries = options.maxBakeRetries ?? 3;
    this._maxUploadRetries = options.maxUploadRetries ?? 3;
    this._baseRetryBackoffFrames = options.baseRetryBackoffFrames ?? 5;
  }

  /** Called when the WebGL context is lost. */
  onContextLost(): void {
    this._contextLost = true;
    // Stop GPU uploads and evict all resident geometry.
    this._chunkUploadQueue.invalidateAll();
    // Mark all registry resources invalid (factories remain intact).
    this._registry.clearLiveResources();
    // Reset bake queue so all chunks are re-baked.
    this._chunkBakeQueue.invalidateAllResident();
    // Reset residency manager state (pure metadata stays intact).
    this._residencyManager.invalidateAllResident();
  }

  /** Called when the WebGL context is restored. */
  onContextRestored(): void {
    this._contextLost = false;
    // Process any retry-pending bakes immediately.
    this._chunkBakeQueue.processRetries(this._currentFrame);
  }

  /**
   * Record a worker bake failure and schedule a retry with render-frame backoff.
   */
  onWorkerFailure(chunkId: ChunkId, errorCode: RenderResourceErrorCode, message: string): void {
    if (this._contextLost) return;
    const record = this._recordFailure(chunkId, errorCode, message);
    const backoff = this._computeBackoff(record.retryCount);
    this._chunkBakeQueue.onWorkerFailed(chunkId, this._currentFrame + backoff);
    this._totalRetries++;
  }

  /**
   * Record an upload failure. The upload queue handles its own retry via
   * `processFrame` with the current frame id.
   */
  onUploadFailure(chunkId: ChunkId, errorCode: RenderResourceErrorCode, message: string): void {
    if (this._contextLost) return;
    this._recordFailure(chunkId, errorCode, message);
  }

  /** Advance to the next render frame and process due retries. */
  advanceFrame(frameId: number): void {
    this._currentFrame = frameId;
    this._chunkBakeQueue.processRetries(frameId);
  }

  /** Return a debug snapshot of failure and retry state. */
  debugStatus(): RenderResourceRecoveryDebug {
    return {
      failedChunks: Array.from(this._failures.values()),
      contextLost: this._contextLost,
      totalRetries: this._totalRetries,
    };
  }

  /** Whether the renderer is currently recovering from a context loss. */
  get contextLost(): boolean {
    return this._contextLost;
  }

  /** Current render frame tracked by the recovery coordinator. */
  get currentFrame(): number {
    return this._currentFrame;
  }

  private _recordFailure(
    chunkId: ChunkId,
    errorCode: RenderResourceErrorCode,
    message: string,
  ): ChunkFailureRecord {
    const existing = this._failures.get(chunkId);
    const isUpload = errorCode === "upload_failure";
    const maxRetries = isUpload ? this._maxUploadRetries : this._maxBakeRetries;
    const updated: ChunkFailureRecord = {
      chunkId,
      errorCode,
      message,
      retryCount: (existing?.retryCount ?? 0) + 1,
      retryAfterFrame: this._currentFrame + this._computeBackoff((existing?.retryCount ?? 0) + 1),
      maxRetries,
      permanent: (existing?.retryCount ?? 0) + 1 > maxRetries,
    };
    this._failures.set(chunkId, updated);
    return updated;
  }

  private _computeBackoff(retryCount: number): number {
    return this._baseRetryBackoffFrames * retryCount;
  }
}

import type { ChunkId } from "@old-town/shared";
import type { BufferAttribute, BufferGeometry, Group, Material, Scene } from "three";
import {
  MeshLambertMaterial,
  StaticDrawUsage,
  BufferAttribute as ThreeBufferAttribute,
  BufferGeometry as ThreeBufferGeometry,
  Group as ThreeGroup,
  Mesh as ThreeMesh,
} from "three";
import type { ChunkBakeQueue } from "./ChunkBakeQueue";
import type { BakedChunkPayload, MaterialGroup } from "./ChunkBakeWorkerClient";
import type { RenderResourceKey, RenderResourceRegistry } from "./RenderResourceRegistry";
import { MaterialColorResolver } from "./MaterialColorResolver";

/** Per-frame budget for GPU upload work. */
export interface ChunkUploadBudget {
  /** Max CPU time (ms) spent uploading per frame. */
  readonly maxMsPerFrame: number;
  /** Max number of chunk uploads per frame. */
  readonly maxChunksPerFrame: number;
}

const MAX_UPLOAD_RETRIES = 3;
const RETRY_BACKOFF_FRAMES = 5;

/** Internal record for a chunk waiting to be uploaded. */
export interface QueuedChunkUpload {
  readonly chunkId: ChunkId;
  readonly payload: BakedChunkPayload;
  readonly enqueuedAt: number;
  state: "queued" | "uploading" | "uploaded" | "failed" | "retry_pending";
  retryCount: number;
  retryAfterFrame: number;
}

/** Diagnostics exposed for the E35 HUD. */
export interface ChunkUploadStats {
  /** Number of chunks currently queued for upload. */
  readonly queueDepth: number;
  /** Milliseconds spent on the last upload attempt. */
  readonly lastUploadDurationMs: number;
  /** Total successful uploads since creation. */
  readonly totalUploads: number;
  /** Total failed uploads since creation. */
  readonly totalFailures: number;
}

/** Mutable build state for a single upload attempt. */
interface UploadAttempt {
  geometry: BufferGeometry;
  materials: Material[];
  materialKeys: RenderResourceKey[];
  group: Group;
}

export const DEFAULT_UPLOAD_BUDGET: ChunkUploadBudget = {
  maxMsPerFrame: 2,
  maxChunksPerFrame: 1,
};

export interface ChunkUploadQueueOptions {
  readonly scene: Scene;
  readonly registry: RenderResourceRegistry;
  readonly chunkBakeQueue: ChunkBakeQueue;
  readonly budget?: ChunkUploadBudget;
  /** External predicate that returns false during combat-active frames. */
  canUploadHeavyResources?: () => boolean;
  /** Material color resolver for terrain material creation. */
  colorResolver?: MaterialColorResolver;
}

/**
 * Main-thread GPU upload queue that converts baked chunk buffers into Three.js
 * resources within a strict per-frame time budget.
 *
 * Uploads are ordered FIFO by enqueue time. Each chunk becomes one Group
 * containing one Mesh per material layer (grouped via BufferGeometry.addGroup).
 * Materials are created once through the RenderResourceRegistry and shared
 * across all chunks that use the same materialId.
 */
export class ChunkUploadQueue {
  private readonly _scene: Scene;
  private readonly _registry: RenderResourceRegistry;
  private readonly _chunkBakeQueue: ChunkBakeQueue;
  private readonly _budget: ChunkUploadBudget;
  private readonly _canUploadHeavyResources: () => boolean;
  private _colorResolver: MaterialColorResolver;
  private readonly _queue: QueuedChunkUpload[] = [];
  private readonly _uploadedGroups = new Map<ChunkId, Group>();
  private readonly _uploadedMaterialKeys = new Map<ChunkId, RenderResourceKey[]>();
  private _totalUploads = 0;
  private _totalFailures = 0;
  private _lastUploadDurationMs = 0;
  private _disposed = false;

  constructor(options: ChunkUploadQueueOptions) {
    this._scene = options.scene;
    this._registry = options.registry;
    this._chunkBakeQueue = options.chunkBakeQueue;
    this._budget = options.budget ?? DEFAULT_UPLOAD_BUDGET;
    this._canUploadHeavyResources = options.canUploadHeavyResources ?? (() => true);
    this._colorResolver = options.colorResolver ?? new MaterialColorResolver({});
  }

  /** Update the color resolver after content registries are loaded. */
  setColorResolver(resolver: MaterialColorResolver): void {
    this._colorResolver = resolver;
  }

  /** Get the material color record for passing to the bake worker. */
  get colorRecord(): Record<string, number> {
    return this._colorResolver.toRecord();
  }

  /** Number of chunks currently queued for upload. */
  get queueDepth(): number {
    return this._queue.filter((q) => q.state === "queued").length;
  }

  /** Whether heavy uploads (textures, large geometry) are currently allowed. */
  get canUploadHeavyResources(): boolean {
    return this._canUploadHeavyResources();
  }

  /** Milliseconds spent on the last upload attempt. */
  get lastUploadDurationMs(): number {
    return this._lastUploadDurationMs;
  }

  /** Enqueue a baked chunk payload for GPU upload and mark the lifecycle state. */
  enqueueBakedChunk(chunkId: ChunkId, payload: BakedChunkPayload): void {
    this._ensureNotDisposed();
    this._chunkBakeQueue.onWorkerComplete(chunkId);
    this._queue.push({
      chunkId,
      payload,
      enqueuedAt: performance.now(),
      state: "queued",
      retryCount: 0,
      retryAfterFrame: 0,
    });
  }

  /**
   * Process the upload queue for this frame.
   *
   * @param frameStartMs - High-resolution timestamp when the frame began.
   * @param nowFn        - Optional timestamp source (defaults to performance.now).
   * @param currentFrame - Optional render frame id for retry scheduling.
   */
  processFrame(frameStartMs: number, nowFn?: () => number, currentFrame?: number): void {
    this._ensureNotDisposed();
    const now = nowFn ?? (() => performance.now());
    let chunksProcessed = 0;
    let i = 0;

    while (i < this._queue.length) {
      const elapsed = now() - frameStartMs;
      if (elapsed >= this._budget.maxMsPerFrame) break;
      if (chunksProcessed >= this._budget.maxChunksPerFrame) break;

      const item = this._queue[i];
      if (!item || (item.state !== "queued" && item.state !== "retry_pending")) {
        this._queue.splice(i, 1);
        continue;
      }

      if (
        item.state === "retry_pending" &&
        currentFrame !== undefined &&
        item.retryAfterFrame > currentFrame
      ) {
        i++;
        continue;
      }

      item.state = "uploading";
      const uploadStart = now();
      const attempt = this._tryBuildUpload(item.chunkId, item.payload);

      if (attempt) {
        this._commitUpload(item.chunkId, attempt);
        this._chunkBakeQueue.onGpuUploadComplete(item.chunkId);
        this._totalUploads++;
        item.state = "uploaded";
        this._queue.splice(i, 1);
      } else {
        item.retryCount++;
        if (item.retryCount > MAX_UPLOAD_RETRIES) {
          this._totalFailures++;
          item.state = "failed";
          this._queue.splice(i, 1);
        } else {
          item.state = "retry_pending";
          item.retryAfterFrame = (currentFrame ?? 0) + RETRY_BACKOFF_FRAMES * item.retryCount;
          this._queue.splice(i, 1);
          this._queue.push(item);
          chunksProcessed++;
          continue;
        }
      }

      this._lastUploadDurationMs = now() - uploadStart;
      chunksProcessed++;
    }
  }

  /** Return a snapshot of upload diagnostics. */
  stats(): ChunkUploadStats {
    return {
      queueDepth: this.queueDepth,
      lastUploadDurationMs: this._lastUploadDurationMs,
      totalUploads: this._totalUploads,
      totalFailures: this._totalFailures,
    };
  }

  /** Retrieve the Three.js Group for an uploaded chunk, if any. */
  getChunkGroup(chunkId: ChunkId): Group | undefined {
    return this._uploadedGroups.get(chunkId);
  }

  /** Remove an uploaded chunk from the scene and release its resources. */
  evictChunk(chunkId: ChunkId): void {
    const group = this._uploadedGroups.get(chunkId);
    if (group) {
      this._scene.remove(group);
      this._disposeGroupContents(group);
      this._uploadedGroups.delete(chunkId);
    }
    const keys = this._uploadedMaterialKeys.get(chunkId);
    if (keys) {
      for (const key of keys) {
        this._registry.releaseMaterial(key);
      }
      this._uploadedMaterialKeys.delete(chunkId);
    }
  }

  /** Evict all uploaded chunks and clear the pending queue. Idempotent. */
  invalidateAll(): void {
    for (const chunkId of Array.from(this._uploadedGroups.keys())) {
      this.evictChunk(chunkId);
    }
    this._queue.length = 0;
  }

  /** Dispose the entire queue and all uploaded resources. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.invalidateAll();
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error("ChunkUploadQueue has been disposed.");
    }
  }

  private _tryBuildUpload(chunkId: ChunkId, payload: BakedChunkPayload): UploadAttempt | null {
    try {
      const geometry = new ThreeBufferGeometry();

      // Positions
      geometry.setAttribute("position", new ThreeBufferAttribute(payload.positions, 3));
      (geometry.attributes.position as BufferAttribute).setUsage(StaticDrawUsage);

      // Normals
      if (payload.normals && payload.normals.length > 0) {
        geometry.setAttribute("normal", new ThreeBufferAttribute(payload.normals, 3));
        (geometry.attributes.normal as BufferAttribute).setUsage(StaticDrawUsage);
      }

      // Colors (vertex colors)
      if (payload.colors && payload.colors.length > 0) {
        geometry.setAttribute("color", new ThreeBufferAttribute(payload.colors, 3));
        (geometry.attributes.color as BufferAttribute).setUsage(StaticDrawUsage);
      }

      // Index buffer
      geometry.setIndex(new ThreeBufferAttribute(payload.indices, 1));
      (geometry.index as BufferAttribute).setUsage(StaticDrawUsage);

      // Material groups: one draw call per material layer
      // Deduplicate materials by materialId so groups with the same materialId
      // share the same material index.
      const materials: Material[] = [];
      const materialKeys: RenderResourceKey[] = [];
      const materialIndexMap = new Map<string, number>();
      for (const mg of payload.materialGroups) {
        const key = this._materialKeyFor(mg);
        let materialIndex = materialIndexMap.get(mg.materialId);
        if (materialIndex === undefined) {
          materialKeys.push(key);
          if (!this._registry.hasMaterialFactory(key)) {
            this._registry.registerMaterial(key, () => this._createTerrainMaterial(mg.materialId));
          }
          const material = this._registry.getMaterial(key);
          materialIndex = materials.length;
          materialIndexMap.set(mg.materialId, materialIndex);
          materials.push(material);
        }
        geometry.addGroup(mg.startIndex, mg.count, materialIndex);
      }

      if (materials.length === 0) {
        // Defensive: at least one material so the mesh is valid
        const fallbackKey = this._materialKeyFor({
          materialId: "default",
          startIndex: 0,
          count: 0,
        });
        materialKeys.push(fallbackKey);
        if (!this._registry.hasMaterialFactory(fallbackKey)) {
          this._registry.registerMaterial(fallbackKey, () =>
            this._createTerrainMaterial("default"),
          );
        }
        materials.push(this._registry.getMaterial(fallbackKey));
      }

      const mesh = new ThreeMesh(geometry, materials);
      mesh.name = `chunk_${chunkId}`;

      const group = new ThreeGroup();
      group.name = `chunk_group_${chunkId}`;
      group.add(mesh);

      return { geometry, materials, materialKeys, group };
    } catch (_err) {
      // Upload failure: ensure partial resources are cleaned up
      this._disposePayloadBuffers(payload);
      return null;
    }
  }

  private _commitUpload(chunkId: ChunkId, attempt: UploadAttempt): void {
    this._uploadedGroups.set(chunkId, attempt.group);
    this._uploadedMaterialKeys.set(chunkId, attempt.materialKeys);
    this._scene.add(attempt.group);
  }

  private _disposeGroupContents(group: Group): void {
    for (const child of group.children) {
      if (child instanceof ThreeMesh) {
        child.geometry.dispose();
        // Materials are released via registry ref counts, not here
      }
    }
    group.clear();
  }

  private _disposePayloadBuffers(_payload: BakedChunkPayload): void {
    // Detached buffers are already owned by the typed arrays; no extra disposal needed.
    // The geometry disposal in _tryBuildUpload cleans up the BufferGeometry.
  }

  private _materialKeyFor(mg: MaterialGroup): RenderResourceKey {
    return {
      type: "terrain",
      contentId: `terrain:${mg.materialId}`,
      variant: "default",
      materialId: "default",
    };
  }

  private _createTerrainMaterial(materialId: string): Material {
    return new MeshLambertMaterial({
      color: this._colorResolver.resolve(materialId),
      vertexColors: true,
      flatShading: true,
    });
  }
}

import type { RegionId, RegionTileData } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  type BakeChunkFailure,
  type BakeChunkRequest,
  type BakeChunkSuccess,
  type BakedChunkPayload,
  type CancelBakeChunk,
  ChunkBakeWorkerClient,
  createDefaultWorkerPoolSize,
  createSynchronousTestClient,
  type WorkerLike,
} from "./ChunkBakeWorkerClient";

function makeRequest(
  overrides: Partial<Omit<BakeChunkRequest, "jobId" | "type">> = {},
): Omit<BakeChunkRequest, "jobId"> {
  return {
    type: "bake_chunk",
    regionId: "0:0:0" as RegionId,
    chunkCoord: { cx: 0, cy: 0, plane: 0 as 0 },
    tiles: [],
    objectRefs: [],
    requestVersion: 1,
    ...overrides,
  };
}

function makeTile(x: number, y: number, height = 0): RegionTileData {
  return {
    x,
    y,
    height,
    underlayId: "grass",
    collision: 0,
  };
}

/** Deferred worker that only completes when flush() is called by the test. */
class DeferredWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private _pending = new Map<string, BakeChunkRequest>();
  private _shouldFail = false;

  setShouldFail(value: boolean): void {
    this._shouldFail = value;
  }

  postMessage(data: unknown, _transfer?: Transferable[]): void {
    const msg = data as BakeChunkRequest | CancelBakeChunk;
    if (msg.type === "cancel_bake_chunk") {
      this._pending.delete(msg.jobId);
      return;
    }
    if (msg.type === "bake_chunk") {
      this._pending.set(msg.jobId, msg);
    }
  }

  flush(jobId: string): void {
    const msg = this._pending.get(jobId);
    if (!msg || !this.onmessage) return;
    this._pending.delete(jobId);

    if (this._shouldFail) {
      const failure: BakeChunkFailure = {
        type: "bake_chunk_failure",
        jobId: msg.jobId,
        regionId: msg.regionId,
        chunkCoord: msg.chunkCoord,
        errorCode: "test_error",
        message: "Simulated worker failure",
      };
      this.onmessage(new MessageEvent("message", { data: failure }));
      return;
    }

    const positions = new Float32Array([0, 0, 0]);
    const success: BakeChunkSuccess = {
      type: "bake_chunk_success",
      jobId: msg.jobId,
      regionId: msg.regionId,
      chunkCoord: msg.chunkCoord,
      payload: {
        positions,
        normals: new Float32Array([0, 1, 0]),
        colors: new Float32Array([1, 1, 1]),
        indices: new Uint32Array([0]),
        materialGroups: [{ startIndex: 0, count: 1, materialId: "test" }],
        bounds: { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
        tileMetadata: [],
        collisionDebugData: [],
        objectInstanceDescriptors: [],
      },
      transferables: [positions.buffer],
    };
    this.onmessage(new MessageEvent("message", { data: success }));
  }

  flushAll(): void {
    for (const jobId of Array.from(this._pending.keys())) {
      this.flush(jobId);
    }
  }

  terminate(): void {
    this._pending.clear();
  }
}

/** Worker that processes tiles and builds a real payload inline. */
class BakingWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(data: unknown, _transfer?: Transferable[]): void {
    const msg = data as BakeChunkRequest | CancelBakeChunk;
    if (msg.type === "cancel_bake_chunk") return;
    if (msg.type !== "bake_chunk") return;

    const tiles = msg.tiles;
    const objectRefs = msg.objectRefs;
    const vCount = Math.max(1, tiles.length * 4);
    const iCount = Math.max(1, tiles.length * 6);

    const positions = new Float32Array(vCount * 3);
    const normals = new Float32Array(vCount * 3);
    const colors = new Float32Array(vCount * 3);
    const indices = new Uint32Array(iCount);

    let v = 0;
    let i = 0;
    for (const tile of tiles) {
      const baseX = tile.x;
      const baseY = tile.y;
      const h = tile.height;
      const quad: [number, number, number][] = [
        [baseX, h, baseY],
        [baseX + 1, h, baseY],
        [baseX + 1, h, baseY + 1],
        [baseX, h, baseY + 1],
      ];
      for (let j = 0; j < 4; j++) {
        const [qx, qy, qz] = quad[j]!;
        positions[v * 3 + 0] = qx;
        positions[v * 3 + 1] = qy;
        positions[v * 3 + 2] = qz;
        normals[v * 3 + 0] = 0;
        normals[v * 3 + 1] = 1;
        normals[v * 3 + 2] = 0;
        colors[v * 3 + 0] = 0.5;
        colors[v * 3 + 1] = 0.6;
        colors[v * 3 + 2] = 0.4;
        v++;
      }
      indices[i + 0] = v - 4;
      indices[i + 1] = v - 3;
      indices[i + 2] = v - 2;
      indices[i + 3] = v - 4;
      indices[i + 4] = v - 2;
      indices[i + 5] = v - 1;
      i += 6;
    }

    const payload: BakedChunkPayload = {
      positions,
      normals,
      colors,
      indices,
      materialGroups: [
        {
          startIndex: 0,
          count: tiles.length > 0 ? iCount : 1,
          materialId: "terrain_default",
        },
      ],
      bounds: {
        minX: msg.chunkCoord.cx * 8,
        minY: msg.chunkCoord.cy * 8,
        minZ: 0,
        maxX: msg.chunkCoord.cx * 8 + 8,
        maxY: msg.chunkCoord.cy * 8 + 8,
        maxZ: 0,
      },
      tileMetadata: tiles.map((t) => ({
        x: t.x,
        y: t.y,
        height: t.height,
        underlayId: t.underlayId,
        overlayId: t.overlayId ?? null,
        collision: t.collision,
      })),
      collisionDebugData: tiles.map((t) => ({
        x: t.x,
        y: t.y,
        flags: t.collision,
      })),
      objectInstanceDescriptors: objectRefs.map((o) => ({
        objectId: o.objectId,
        x: o.x,
        y: o.y,
        z: o.z,
        rotation: o.rotation,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      })),
    };

    const success: BakeChunkSuccess = {
      type: "bake_chunk_success",
      jobId: msg.jobId,
      regionId: msg.regionId,
      chunkCoord: msg.chunkCoord,
      payload,
      transferables: [
        positions.buffer as ArrayBuffer,
        normals.buffer as ArrayBuffer,
        colors.buffer as ArrayBuffer,
        indices.buffer as ArrayBuffer,
      ],
    };

    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data: success }));
    }
  }

  terminate(): void {}
}

/** Worker that can trigger errors on demand. */
class ErrorTriggerWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private _jobId: string | null = null;

  postMessage(data: unknown): void {
    const msg = data as BakeChunkRequest;
    if (msg.type === "bake_chunk") {
      this._jobId = msg.jobId;
    }
  }

  triggerError(): void {
    if (this.onerror && this._jobId) {
      const event = new ErrorEvent("error", { message: "Worker crashed" });
      Object.defineProperty(event, "target", { value: this });
      this.onerror(event);
    }
  }

  terminate(): void {}
}

describe("ChunkBakeWorkerClient", () => {
  // ---------------------------------------------------------------------------
  // Worker success / transferables
  // ---------------------------------------------------------------------------

  it("worker success payloads arrive with transferable ArrayBuffers", () => {
    const successes: {
      payload: BakedChunkPayload;
      transferables: readonly ArrayBuffer[];
    }[] = [];

    const client = createSynchronousTestClient(
      (_jobId, _regionId, _chunkCoord, payload, transferables) => {
        successes.push({ payload, transferables });
      },
      () => {},
    );

    const jobId = client.submit(makeRequest());
    expect(jobId).toBeDefined();
    expect(successes.length).toBe(1);
    expect(successes[0]!.transferables.length).toBeGreaterThan(0);
    for (const buffer of successes[0]!.transferables) {
      expect(buffer).toBeInstanceOf(ArrayBuffer);
    }

    client.dispose();
  });

  it("transfer list contains baked buffers", () => {
    const successes: {
      payload: BakedChunkPayload;
      transferables: readonly ArrayBuffer[];
    }[] = [];

    const client = createSynchronousTestClient(
      (_jobId, _regionId, _chunkCoord, payload, transferables) => {
        successes.push({ payload, transferables });
      },
      () => {},
    );

    client.submit(makeRequest());
    expect(successes.length).toBe(1);
    const { payload, transferables } = successes[0]!;

    expect(transferables.some((b: ArrayBuffer) => b === payload.positions.buffer)).toBe(true);
    expect(transferables.some((b: ArrayBuffer) => b === payload.normals.buffer)).toBe(true);
    expect(transferables.some((b: ArrayBuffer) => b === payload.colors.buffer)).toBe(true);
    expect(transferables.some((b: ArrayBuffer) => b === payload.indices.buffer)).toBe(true);

    client.dispose();
  });

  it("handles success with real tile data", () => {
    const successes: { payload: BakedChunkPayload }[] = [];

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => new BakingWorker(),
      onSuccess: (_jobId, _regionId, _chunkCoord, payload) => {
        successes.push({ payload });
      },
      onFailure: () => {},
    });

    client.submit(
      makeRequest({
        tiles: [makeTile(0, 0, 0), makeTile(1, 0, 1)],
        objectRefs: [{ objectId: "tree", x: 0, y: 0, z: 0, rotation: 0 }],
      }),
    );

    expect(successes.length).toBe(1);
    expect(successes[0]!.payload.positions).toBeInstanceOf(Float32Array);
    expect(successes[0]!.payload.normals).toBeInstanceOf(Float32Array);
    expect(successes[0]!.payload.colors).toBeInstanceOf(Float32Array);
    expect(successes[0]!.payload.indices).toBeInstanceOf(Uint32Array);
    expect(successes[0]!.payload.materialGroups.length).toBeGreaterThan(0);
    expect(successes[0]!.payload.bounds).toBeDefined();
    expect(successes[0]!.payload.tileMetadata.length).toBe(2);
    expect(successes[0]!.payload.collisionDebugData.length).toBe(2);
    expect(successes[0]!.payload.objectInstanceDescriptors.length).toBe(1);

    client.dispose();
  });

  // ---------------------------------------------------------------------------
  // Worker failures
  // ---------------------------------------------------------------------------

  it("worker failures mark jobs failed without corrupting queue", () => {
    const failures: { jobId: string; errorCode: string; message: string }[] = [];
    const successes: unknown[] = [];

    const worker = new DeferredWorker();
    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => successes.push(true),
      onFailure: (jobId, _regionId, _chunkCoord, errorCode, message) => {
        failures.push({ jobId, errorCode, message });
      },
    });

    const jobId1 = client.submit(makeRequest());
    worker.setShouldFail(true);
    worker.flush(jobId1);

    expect(failures.length).toBe(1);
    expect(failures[0]!.jobId).toBe(jobId1);
    expect(failures[0]!.errorCode).toBe("test_error");

    // Second job should succeed on the same worker after failure
    const jobId2 = client.submit(makeRequest());
    worker.setShouldFail(false);
    worker.flush(jobId2);

    expect(successes.length).toBe(1);

    client.dispose();
  });

  it("worker errors from onerror are handled", () => {
    const failures: { jobId: string; errorCode: string }[] = [];
    const worker = new ErrorTriggerWorker();

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => {},
      onFailure: (jobId, _regionId, _chunkCoord, errorCode) => {
        failures.push({ jobId, errorCode });
      },
    });

    const jobId = client.submit(makeRequest());
    worker.triggerError();

    expect(failures.length).toBe(1);
    expect(failures[0]!.jobId).toBe(jobId);
    expect(failures[0]!.errorCode).toBe("worker_error");

    client.dispose();
  });

  // ---------------------------------------------------------------------------
  // Cancellation
  // ---------------------------------------------------------------------------

  it("cancels queued jobs before they reach the worker", () => {
    const successes: unknown[] = [];
    const worker = new DeferredWorker();

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => successes.push(true),
      onFailure: () => {},
    });

    const jobId1 = client.submit(makeRequest());
    const jobId2 = client.submit(makeRequest());

    // jobId1 is active, jobId2 is queued
    client.cancel(jobId2);
    worker.flush(jobId1);

    expect(successes.length).toBe(1);
    // jobId2 should never complete

    client.dispose();
  });

  it("cancellation of active job prevents obsolete chunks from reaching upload", () => {
    const successes: unknown[] = [];
    const failures: unknown[] = [];
    const worker = new DeferredWorker();

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => successes.push(true),
      onFailure: () => failures.push(true),
    });

    const jobId = client.submit(makeRequest());
    client.cancel(jobId);
    worker.flush(jobId);

    // The job was cancelled from active, so the late success should be ignored
    expect(successes.length).toBe(0);
    expect(failures.length).toBe(0);

    client.dispose();
  });

  it("cancel sends cancel message to worker and drains queue", () => {
    const successes: unknown[] = [];
    const worker = new DeferredWorker();

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => successes.push(true),
      onFailure: () => {},
    });

    const jobId1 = client.submit(makeRequest());
    const jobId2 = client.submit(makeRequest());

    client.cancel(jobId1);
    // After cancelling jobId1, jobId2 should be sent to the worker
    worker.flush(jobId2);

    expect(successes.length).toBe(1);
    // jobId1's late flush should be ignored
    worker.flush(jobId1);
    expect(successes.length).toBe(1);

    client.dispose();
  });

  // ---------------------------------------------------------------------------
  // Pool size and concurrency
  // ---------------------------------------------------------------------------

  it("computes deterministic pool size with test injection", () => {
    expect(createDefaultWorkerPoolSize(1)).toBe(1);
    expect(createDefaultWorkerPoolSize(2)).toBe(1);
    expect(createDefaultWorkerPoolSize(3)).toBe(2);
    expect(createDefaultWorkerPoolSize(8)).toBe(2);
  });

  it("creates the configured pool size", () => {
    let created = 0;
    const client = new ChunkBakeWorkerClient({
      poolSize: 3,
      createWorker: () => {
        created++;
        return new DeferredWorker();
      },
      onSuccess: () => {},
      onFailure: () => {},
    });

    expect(created).toBe(3);
    client.dispose();
  });

  it("dispatches jobs to multiple workers", () => {
    const successes: string[] = [];
    const worker0 = new DeferredWorker();
    const worker1 = new DeferredWorker();
    let workerIndex = 0;

    const client = new ChunkBakeWorkerClient({
      poolSize: 2,
      createWorker: () => {
        const worker = workerIndex === 0 ? worker0 : worker1;
        workerIndex++;
        return worker;
      },
      onSuccess: (jobId) => successes.push(jobId),
      onFailure: () => {},
    });

    const jobId1 = client.submit(makeRequest());
    const jobId2 = client.submit(makeRequest());

    // _available is a LIFO stack (push/pop), so jobId1 goes to worker1
    // (pushed second, popped first) and jobId2 goes to worker0.
    worker1.flush(jobId1);
    worker0.flush(jobId2);

    expect(successes.length).toBe(2);
    expect(successes).toContain(jobId1);
    expect(successes).toContain(jobId2);

    client.dispose();
  });

  it("queues jobs when all workers are busy", () => {
    const successes: string[] = [];
    const worker = new DeferredWorker();

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: (jobId) => successes.push(jobId),
      onFailure: () => {},
    });

    const jobId1 = client.submit(makeRequest());
    const jobId2 = client.submit(makeRequest());

    // jobId1 is active, jobId2 is queued
    worker.flush(jobId2);
    expect(successes.length).toBe(0); // jobId2 hasn't been sent yet

    worker.flush(jobId1);
    expect(successes.length).toBe(1);
    expect(successes[0]).toBe(jobId1);

    // Now jobId2 should have been sent to the worker
    worker.flush(jobId2);
    expect(successes.length).toBe(2);
    expect(successes[1]).toBe(jobId2);

    client.dispose();
  });

  // ---------------------------------------------------------------------------
  // No SharedArrayBuffer
  // ---------------------------------------------------------------------------

  it("no SharedArrayBuffer usage is introduced", () => {
    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => new BakingWorker(),
      onSuccess: (_jobId, _regionId, _chunkCoord, _payload, transferables) => {
        for (const buffer of transferables) {
          expect(buffer).toBeInstanceOf(ArrayBuffer);
          if (typeof SharedArrayBuffer !== "undefined") {
            expect(buffer).not.toBeInstanceOf(SharedArrayBuffer);
          }
        }
      },
      onFailure: () => {},
    });

    client.submit(makeRequest());
    client.dispose();
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  it("throws when submitting after dispose", () => {
    const client = createSynchronousTestClient(
      () => {},
      () => {},
    );
    client.dispose();
    expect(() => client.submit(makeRequest())).toThrow("ChunkBakeWorkerClient has been disposed.");
  });

  it("throws when cancelling after dispose", () => {
    const client = createSynchronousTestClient(
      () => {},
      () => {},
    );
    client.dispose();
    expect(() => client.cancel("job-1")).toThrow("ChunkBakeWorkerClient has been disposed.");
  });

  it("dispose is idempotent", () => {
    const client = createSynchronousTestClient(
      () => {},
      () => {},
    );
    client.dispose();
    client.dispose(); // should not throw
    expect(true).toBe(true);
  });

  it("ignores worker messages for unknown job ids", () => {
    const successes: unknown[] = [];
    const failures: unknown[] = [];

    const worker: WorkerLike = {
      onmessage: null,
      onerror: null,
      postMessage(_data: unknown) {
        const fakeSuccess: BakeChunkSuccess = {
          type: "bake_chunk_success",
          jobId: "unknown-job",
          regionId: "0:0:0" as RegionId,
          chunkCoord: { cx: 0, cy: 0, plane: 0 as 0 },
          payload: {
            positions: new Float32Array([0]),
            normals: new Float32Array([0]),
            colors: new Float32Array([0]),
            indices: new Uint32Array([0]),
            materialGroups: [],
            bounds: { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 },
            tileMetadata: [],
            collisionDebugData: [],
            objectInstanceDescriptors: [],
          },
          transferables: [],
        };
        if (this.onmessage) {
          this.onmessage(new MessageEvent("message", { data: fakeSuccess }));
        }
      },
      terminate() {},
    };

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => successes.push(true),
      onFailure: () => failures.push(true),
    });

    const jobId = client.submit(makeRequest());
    worker.postMessage({ type: "bake_chunk", jobId });
    // The worker will send a fake success for unknown job
    expect(successes.length).toBe(0);
    expect(failures.length).toBe(0);

    client.dispose();
  });

  it("handles empty tile arrays", () => {
    const successes: { payload: BakedChunkPayload }[] = [];

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => new BakingWorker(),
      onSuccess: (_jobId, _regionId, _chunkCoord, payload) => {
        successes.push({ payload });
      },
      onFailure: () => {},
    });

    client.submit(makeRequest({ tiles: [] }));
    expect(successes.length).toBe(1);
    expect(successes[0]!.payload.positions.length).toBeGreaterThan(0);
    expect(successes[0]!.payload.indices.length).toBeGreaterThan(0);

    client.dispose();
  });

  it("preserves regionId and chunkCoord in success callbacks", () => {
    const successes: {
      regionId: string;
      chunkCoord: { cx: number; cy: number; plane: number };
    }[] = [];

    const client = createSynchronousTestClient(
      (_jobId, regionId, chunkCoord) => {
        successes.push({ regionId, chunkCoord });
      },
      () => {},
    );

    client.submit(
      makeRequest({
        regionId: "1:2:3" as RegionId,
        chunkCoord: { cx: 5, cy: 6, plane: 1 as 1 },
      }),
    );

    expect(successes.length).toBe(1);
    expect(successes[0]!.regionId).toBe("1:2:3");
    expect(successes[0]!.chunkCoord).toEqual({ cx: 5, cy: 6, plane: 1 });

    client.dispose();
  });
});

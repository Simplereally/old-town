import type { RegionId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  type BakeChunkRequest,
  type CancelBakeChunk,
  ChunkBakeWorkerClient,
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

/** Worker that delays error emission so it can be fired after reassignment. */
class DelayedErrorWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private _jobs: string[] = [];

  postMessage(data: unknown): void {
    const msg = data as BakeChunkRequest | CancelBakeChunk;
    if (msg.type === "bake_chunk") {
      this._jobs.push(msg.jobId);
    }
  }

  triggerError(): void {
    if (this.onerror) {
      this.onerror(new ErrorEvent("error", { message: "Worker crashed" }));
    }
  }

  terminate(): void {}
}

describe("misattribution", () => {
  it("should demonstrate error misattribution after cancel", () => {
    const failures: { jobId: string }[] = [];
    const worker = new DelayedErrorWorker();

    const client = new ChunkBakeWorkerClient({
      poolSize: 1,
      createWorker: () => worker,
      onSuccess: () => {},
      onFailure: (jobId) => {
        failures.push({ jobId });
      },
    });

    const jobIdA = client.submit(makeRequest());
    const jobIdB = client.submit(makeRequest());

    // Cancel A; this sends cancel msg to worker and then drains queue,
    // assigning B to the same worker.
    client.cancel(jobIdA);

    // Now trigger an error from the worker. In the current code,
    // _onWorkerError will look up the worker in _active and find job B.
    worker.triggerError();

    // The bug: job B is blamed, not job A.
    expect(failures.length).toBe(1);
    expect(failures[0]?.jobId).toBe(jobIdB); // demonstrates misattribution
  });
});

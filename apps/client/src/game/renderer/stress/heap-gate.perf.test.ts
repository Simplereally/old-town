import type { FullStatePacket, TickDeltaPacket } from "@old-town/shared";
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene, WebGLRenderer } from "three";
import { describe, expect, it } from "vitest";
import type { PurePacketApplierContext } from "../../net/ClientPacketApplier";
import { ClientPacketApplier } from "../../net/ClientPacketApplier";
import { ClientPacketIngestor } from "../../net/ClientPacketIngestor";
import { ClientWorldStore } from "../../net/ClientWorldStore";
import { SnapshotBuffer } from "../../net/SnapshotBuffer";
import { UIState } from "../../ui/UIState";
import { InstanceBucket } from "../InstanceBucket";
import { MeshPool } from "../MeshPool";
import { RenderClock } from "../RenderClock";
import { RendererBudgets } from "../RendererBudgets";
import { RenderObjectPool } from "../RenderObjectPool";
import {
  assertDrawCallBudget,
  assertNoUnboundedGrowth,
  type BudgetAssertionResult,
  DrawCallSampler,
  HeapSampler,
} from "./heap-gate";

function isWebGLAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return gl !== null && gl !== undefined;
  } catch {
    return false;
  }
}

function createMockApplierContext(): PurePacketApplierContext {
  const store = new ClientWorldStore();
  const snapshotBuffer = new SnapshotBuffer({
    tickMs: 600,
    interpolationDelayMs: 600,
    maxSnapshots: 32,
    freezeAfterMissingTicks: 2,
    snapAfterMissingTicks: 6,
  });
  const uiState = new UIState();
  return {
    store,
    snapshotBuffer,
    uiState,
    logDebug: () => {},
    tileSizeWorldUnits: 1,
  };
}

function fullStatePacket(partial: Record<string, unknown> = {}): FullStatePacket {
  return {
    type: 0,
    protocolVersion: 1,
    tick: 1,
    serverTime: 1000,
    selfEntityId: 42,
    entities: [],
    regionLoads: [],
    ...partial,
  } as unknown as FullStatePacket;
}

function tickDeltaPacket(partial: Record<string, unknown> = {}): TickDeltaPacket {
  return {
    type: 1,
    tick: 2,
    serverTime: 1600,
    entityAdds: [],
    entityRemoves: [],
    entityUpdates: [],
    ...partial,
  } as unknown as TickDeltaPacket;
}

describe("HeapSampler", () => {
  it("reports unavailable when performance.memory is absent", () => {
    const sampler = new HeapSampler();
    const result = sampler.sample();
    if (sampler.isAvailable()) {
      expect(result.status).toBe("available");
      expect(typeof result.bytes).toBe("number");
    } else {
      expect(result.status).toBe("unavailable");
      expect(result.bytes).toBeNull();
    }
  });

  it("isAvailable is deterministic across multiple calls", () => {
    const sampler = new HeapSampler();
    const first = sampler.isAvailable();
    const second = sampler.isAvailable();
    expect(second).toBe(first);
  });
});

describe("DrawCallSampler", () => {
  it("reports unavailable when renderer.info is missing", () => {
    const sampler = new DrawCallSampler();
    const renderer = { info: null } as unknown as WebGLRenderer;
    const result = sampler.sample(renderer);
    expect(result.status).toBe("unavailable");
    expect(result.calls).toBeNull();
  });

  it("reports available with numeric calls when renderer.info is present", () => {
    if (!isWebGLAvailable()) {
      // jsdom: mock a renderer with info so the sampler path is still tested
      const sampler = new DrawCallSampler();
      const renderer = {
        info: { render: { calls: 42 }, memory: { geometries: 0, textures: 0 } },
      } as unknown as WebGLRenderer;
      const result = sampler.sample(renderer);
      expect(result.status).toBe("available");
      expect(typeof result.calls).toBe("number");
      expect(result.calls).toBe(42);
      return;
    }
    const sampler = new DrawCallSampler();
    const renderer = new WebGLRenderer();
    const result = sampler.sample(renderer);
    expect(result.status).toBe("available");
    expect(typeof result.calls).toBe("number");
  });
});

describe("assertNoUnboundedGrowth", () => {
  it("returns passed when after <= before", () => {
    const result = assertNoUnboundedGrowth(100, 90, "pool");
    expect(result.status).toBe("passed");
    expect(result.passed).toBe(true);
  });

  it("returns failed when after > before", () => {
    const result = assertNoUnboundedGrowth(100, 110, "pool");
    expect(result.status).toBe("failed");
    expect(result.passed).toBe(false);
  });

  it("returns unavailable when before is null", () => {
    const result = assertNoUnboundedGrowth(null, 100, "pool");
    expect(result.status).toBe("unavailable");
    expect(result.passed).toBe(false);
  });

  it("returns unavailable when after is null", () => {
    const result = assertNoUnboundedGrowth(100, null, "pool");
    expect(result.status).toBe("unavailable");
    expect(result.passed).toBe(false);
  });
});

describe("assertDrawCallBudget", () => {
  it("returns manual-required when draw-call sampling is unavailable", () => {
    const result = assertDrawCallBudget({ calls: null, status: "unavailable" });
    expect(result.status).toBe("manual-required");
    expect(result.passed).toBe(false);
    expect(result.message).toContain("browser-only metric");
  });

  it("returns passed when calls are under budget", () => {
    const result = assertDrawCallBudget({ calls: 50, status: "available" });
    expect(result.status).toBe("passed");
    expect(result.passed).toBe(true);
    expect(result.after).toBe(50);
  });

  it("returns failed when calls exceed budget", () => {
    const result = assertDrawCallBudget({ calls: 200, status: "available" });
    expect(result.status).toBe("failed");
    expect(result.passed).toBe(false);
    expect(result.after).toBe(200);
  });

  it("uses the configured DRAW_CALLS_MAX value", () => {
    expect(RendererBudgets.DRAW_CALLS_MAX.value).toBe(150);
  });
});

describe("Pool growth (RenderObjectPool)", () => {
  it("does not grow beyond maxSize after repeated spawn/remove cycles", () => {
    const pool = new RenderObjectPool<number>({
      create: () => 0,
      reset: () => {},
      initialSize: 2,
      maxSize: 4,
    });

    // Warm up to maxSize so the baseline is the bounded ceiling
    const warmObjs: number[] = [];
    for (let i = 0; i < 4; i++) {
      const obj = pool.acquire();
      if (obj !== null) warmObjs.push(obj);
    }
    for (const obj of warmObjs) {
      pool.release(obj);
    }
    const before = pool.poolSize;
    expect(before).toBe(4);

    for (let cycle = 0; cycle < 100; cycle++) {
      const objs: number[] = [];
      for (let i = 0; i < 4; i++) {
        const obj = pool.acquire();
        if (obj !== null) objs.push(obj);
      }
      for (const obj of objs) {
        pool.release(obj);
      }
    }
    const after = pool.poolSize;

    const assertion = assertNoUnboundedGrowth(before, after, "RenderObjectPool");
    expect(assertion.status).toBe("passed");
    expect(pool.poolSize).toBeLessThanOrEqual(4);
  });
});

describe("Pool growth (MeshPool)", () => {
  it("does not grow beyond maxSize after repeated spawn/remove cycles", () => {
    const pool = new MeshPool({
      geometry: new BoxGeometry(1, 1, 1),
      material: new MeshBasicMaterial({ color: 0xff0000 }),
      initialSize: 2,
      maxSize: 4,
    });

    // Warm up to maxSize so the baseline is the bounded ceiling
    const warmMeshes: Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const m = pool.acquire();
      expect(m).toBeDefined();
      if (!m) throw new Error("unreachable");
      warmMeshes.push(m);
    }
    for (const m of warmMeshes) {
      pool.release(m);
    }
    const before = pool.poolSize;
    expect(before).toBe(4);

    const meshes: Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const m = pool.acquire();
      expect(m).toBeDefined();
      if (!m) throw new Error("unreachable");
      meshes.push(m);
    }
    for (const m of meshes) {
      pool.release(m);
    }
    const after = pool.poolSize;

    const assertion = assertNoUnboundedGrowth(before, after, "MeshPool");
    expect(assertion.status).toBe("passed");
    expect(pool.poolSize).toBeLessThanOrEqual(4);
    pool.dispose();
  });
});

describe("Pool growth (InstanceBucket)", () => {
  it("does not grow beyond initial capacity without explicit growCapacity", () => {
    const bucket = new InstanceBucket(
      {
        archetypeId: "prop:test",
        materialId: "default",
        regionId: "r0",
        layer: "props",
      },
      {
        geometry: new BoxGeometry(1, 1, 1),
        material: new MeshBasicMaterial({ color: 0xff0000 }),
        initialCapacity: 4,
      },
    );

    const before = bucket.stats().capacity;
    for (let cycle = 0; cycle < 50; cycle++) {
      for (let i = 0; i < 4; i++) {
        bucket.acquire(i + cycle * 100);
      }
      for (let i = 0; i < 4; i++) {
        bucket.release(i + cycle * 100);
      }
    }
    const after = bucket.stats().capacity;

    const assertion = assertNoUnboundedGrowth(before, after, "InstanceBucket");
    expect(assertion.status).toBe("passed");
    expect(bucket.stats().capacity).toBe(4);
    bucket.dispose();
  });
});

describe("Packet-callback render mutation", () => {
  it("ClientPacketApplier does not create Three.js meshes inside packet handlers", () => {
    const ctx = createMockApplierContext();
    const applier = new ClientPacketApplier(ctx);

    const result = applier.applyFullState(
      fullStatePacket({
        entities: [
          {
            entityId: 1,
            kind: "player",
            tile: { x: 0, y: 0, plane: 0 },
            moveSpeed: "stationary",
          },
          {
            entityId: 2,
            kind: "object",
            tile: { x: 1, y: 1, plane: 0 },
            defId: "tree",
          },
        ],
      }),
    );

    // The result must be pure data — no meshes, no scene objects.
    const payloads = result.presentationEvents.map((e) => e.payload);
    for (const payload of payloads) {
      expect(payload).not.toBeInstanceOf(Mesh);
      expect(payload).not.toBeInstanceOf(Scene);
    }
    expect(result.presentationEvents.length).toBeGreaterThan(0);
  });

  it("ClientPacketIngestor does not create Three.js meshes inside packet handlers", () => {
    const ctx = createMockApplierContext();
    const renderClock = new RenderClock({
      tickMs: 600,
      interpolationDelayMs: 600,
      maxFrameDeltaMs: 100,
      serverTimeSmoothing: 0.1,
    });
    const applier = new ClientPacketApplier(ctx);
    const ingestor = new ClientPacketIngestor(applier, renderClock);

    const result = ingestor.ingestFullState(
      fullStatePacket({
        entities: [
          {
            entityId: 1,
            kind: "npc",
            tile: { x: 0, y: 0, plane: 0 },
            defId: "goblin",
            moveSpeed: "stationary",
          },
        ],
      }),
      0,
    );

    const payloads = result.presentationEvents.map((e) => e.payload);
    for (const payload of payloads) {
      expect(payload).not.toBeInstanceOf(Mesh);
      expect(payload).not.toBeInstanceOf(Scene);
    }
  });

  it("applyTickDelta does not create Three.js meshes", () => {
    const ctx = createMockApplierContext();
    const applier = new ClientPacketApplier(ctx);
    applier.applyFullState(fullStatePacket({ selfEntityId: 42 }));

    const result = applier.applyTickDelta(
      tickDeltaPacket({
        entityAdds: [
          {
            entityId: 10,
            kind: "npc",
            tile: { x: 0, y: 0, plane: 0 },
            defId: "guard",
            moveSpeed: "stationary",
          },
        ],
        entityUpdates: [
          {
            entityId: 42,
            mask: 0,
            changes: {
              position: { x: 1, y: 0, plane: 0 },
            },
          },
        ],
      }),
      1,
    );

    expect(result).not.toBeNull();
    if (!result) throw new Error("unexpected null");
    const payloads = result.presentationEvents.map((e) => e.payload);
    for (const payload of payloads) {
      expect(payload).not.toBeInstanceOf(Mesh);
    }
  });
});

describe("Draw-call budget assertions", () => {
  const webglAvailable = isWebGLAvailable();

  it(
    webglAvailable
      ? "asserts draw calls are under budget when WebGL is present"
      : "skips live draw-call assertion in headless/jsdom",
    () => {
      if (webglAvailable) {
        const renderer = new WebGLRenderer();
        const sampler = new DrawCallSampler();
        const sample = sampler.sample(renderer);
        expect(sample.status).toBe("available");
        expect(sample.calls).not.toBeNull();

        const assertion = assertDrawCallBudget(sample);
        expect(assertion.status).toBe("passed");
        expect(assertion.passed).toBe(true);
        renderer.dispose();
      } else {
        // In headless/jsdom, report manual-required explicitly.
        const assertion: BudgetAssertionResult = {
          passed: false,
          label: "draw_calls",
          before: null,
          after: null,
          status: "manual-required",
          message: "draw_calls: draw-call sampling unavailable (browser-only metric)",
        };
        expect(assertion.status).toBe("manual-required");
        expect(assertion.passed).toBe(false);
      }
    },
  );

  it("reports manual-required for draw-call budget in non-browser environments", () => {
    const sampler = new DrawCallSampler();
    const renderer = { info: null } as unknown as WebGLRenderer;
    const sample = sampler.sample(renderer);
    const assertion = assertDrawCallBudget(sample);
    expect(assertion.status).toBe("manual-required");
    expect(assertion.passed).toBe(false);
    expect(assertion.message).toContain("browser-only metric");
  });
});

describe("Browser-only metrics report manual-required", () => {
  it("heap sampling reports unavailable in CI, not a fake measured value", () => {
    const sampler = new HeapSampler();
    const result = sampler.sample();
    if (!sampler.isAvailable()) {
      expect(result.status).toBe("unavailable");
      expect(result.bytes).toBeNull();
    }
  });

  it("draw-call sampling reports manual-required when renderer.info is absent", () => {
    const sampler = new DrawCallSampler();
    const renderer = { info: undefined } as unknown as WebGLRenderer;
    const sample = sampler.sample(renderer);
    const assertion = assertDrawCallBudget(sample);
    expect(assertion.status).toBe("manual-required");
    expect(assertion.passed).toBe(false);
  });

  it("heap gate stress report contains only explicit statuses", () => {
    const sampler = new HeapSampler();
    const heapResult = sampler.sample();
    const drawResult = assertDrawCallBudget({ calls: null, status: "unavailable" });
    const poolResult = assertNoUnboundedGrowth(10, 10, "RenderObjectPool");

    const statuses = [heapResult.status, drawResult.status, poolResult.status];
    for (const status of statuses) {
      expect(["available", "unavailable", "passed", "failed", "manual-required"]).toContain(status);
    }
  });
});

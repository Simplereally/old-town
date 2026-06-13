import { describe, expect, it, vi } from "vitest";
import { BudgetGateType, RendererBudgets } from "./RendererBudgets";
import { GpuTimingAdapter, RendererMetrics } from "./RendererMetrics";

describe("RendererMetrics", () => {
  it("computes rolling p50/p95/p99 correctly over a fixed window", () => {
    const metrics = new RendererMetrics();
    const windowSize = 180;

    // Fill the buffer with values 1..200. The rolling window should keep the last 180 (21..200).
    for (let i = 1; i <= 200; i++) {
      metrics.recordFrame(i, 0, 0, 0);
    }

    const stats = metrics.computeStats();
    const sorted = Array.from({ length: windowSize }, (_, j) => 21 + j);

    // p50 at index 0.5 * 179 = 89.5 => 110 * 0.5 + 111 * 0.5 = 110.5
    const expectedP50 = (sorted[89] as number) * 0.5 + (sorted[90] as number) * 0.5;
    // p95 at index 0.95 * 179 = 170.05 => 191 * 0.95 + 192 * 0.05 = 191.05
    const expectedP95 = (sorted[170] as number) * 0.95 + (sorted[171] as number) * 0.05;
    // p99 at index 0.99 * 179 = 177.21 => 198 * 0.79 + 199 * 0.21 = 198.21
    const expectedP99 = (sorted[177] as number) * 0.79 + (sorted[178] as number) * 0.21;

    expect(stats.frameTimeP50).toBeCloseTo(expectedP50, 10);
    expect(stats.frameTimeP95).toBeCloseTo(expectedP95, 10);
    expect(stats.frameTimeP99).toBeCloseTo(expectedP99, 10);
  });

  it("does not allocate in recordFrame across 1000 calls", () => {
    const metrics = new RendererMetrics();
    const originalArray = (metrics as unknown as { frameTimes: Float64Array }).frameTimes;
    expect(originalArray).toBeInstanceOf(Float64Array);

    let allocationCount = 0;
    const OriginalFloat64Array = globalThis.Float64Array;
    const OriginalArray = globalThis.Array;
    const OriginalObjectCreate = Object.create;

    const countingFloat64Array = new Proxy(OriginalFloat64Array, {
      construct() {
        allocationCount++;
        return new OriginalFloat64Array(0);
      },
    });

    const countingArray = new Proxy(OriginalArray, {
      construct() {
        allocationCount++;
        return new OriginalArray(0);
      },
    });

    const countingObjectCreate = (...args: unknown[]) => {
      allocationCount++;
      return (OriginalObjectCreate as unknown as typeof Object.create).apply(Object, args as unknown as [object | null, PropertyDescriptorMap & ThisType<unknown>]);
    };

    globalThis.Float64Array = countingFloat64Array as unknown as Float64ArrayConstructor;
    globalThis.Array = countingArray as unknown as ArrayConstructor;
    Object.create = countingObjectCreate;

    try {
      for (let i = 0; i < 1000; i++) {
        metrics.recordFrame(16.6, i % 10, i % 20, i % 5);
      }
    } finally {
      globalThis.Float64Array = OriginalFloat64Array;
      globalThis.Array = OriginalArray;
      Object.create = OriginalObjectCreate;
    }

    expect(allocationCount).toBe(0);
    expect((metrics as unknown as { frameTimes: Float64Array }).frameTimes).toBe(originalArray);
  });

  it("returns all expected fields from computeStats", () => {
    const metrics = new RendererMetrics();
    metrics.recordFrame(16.6, 100, 200, 300);
    metrics.recordLayerCounts(10, 20, 30);
    metrics.recordSnapshotDepth(5);
    metrics.recordUploadQueueDepth(3);
    metrics.recordWorkerQueueDepth(2);
    metrics.recordHeapSample(1024 * 1024);
    metrics.recordGpuTime(4.5);

    const stats = metrics.computeStats();

    expect(stats).toHaveProperty("fps");
    expect(stats).toHaveProperty("lastFrameTimeMs");
    expect(stats).toHaveProperty("frameTimeP50");
    expect(stats).toHaveProperty("frameTimeP95");
    expect(stats).toHaveProperty("frameTimeP99");
    expect(stats).toHaveProperty("drawCalls");
    expect(stats).toHaveProperty("geometries");
    expect(stats).toHaveProperty("textures");
    expect(stats).toHaveProperty("actors");
    expect(stats).toHaveProperty("objects");
    expect(stats).toHaveProperty("loadedChunks");
    expect(stats).toHaveProperty("snapshotDepth");
    expect(stats).toHaveProperty("uploadQueueDepth");
    expect(stats).toHaveProperty("workerQueueDepth");
    expect(stats).toHaveProperty("latestHeap");
    expect(stats).toHaveProperty("latestGpu");

    expect(typeof stats.fps).toBe("number");
    expect(typeof stats.lastFrameTimeMs).toBe("number");
    expect(typeof stats.frameTimeP50).toBe("number");
    expect(typeof stats.frameTimeP95).toBe("number");
    expect(typeof stats.frameTimeP99).toBe("number");
    expect(stats.drawCalls).toBe(100);
    expect(stats.geometries).toBe(200);
    expect(stats.textures).toBe(300);
    expect(stats.actors).toBe(10);
    expect(stats.objects).toBe(20);
    expect(stats.loadedChunks).toBe(30);
    expect(stats.snapshotDepth).toBe(5);
    expect(stats.uploadQueueDepth).toBe(3);
    expect(stats.workerQueueDepth).toBe(2);
    expect(stats.latestHeap).toBe(1024 * 1024);
    expect(stats.latestGpu).toBe(4.5);
  });
});

describe("GpuTimingAdapter", () => {
  it("returns null when extension is unavailable and does not throw", () => {
    const gl = {
      getExtension: vi.fn().mockReturnValue(null),
      createQuery: vi.fn(),
      deleteQuery: vi.fn(),
      getQueryParameter: vi.fn(),
      getParameter: vi.fn(),
    } as unknown as WebGL2RenderingContext;

    const adapter = new GpuTimingAdapter(gl);
    expect(adapter.isAvailable()).toBe(false);
    expect(adapter.createQuery()).toBeNull();
    expect(() => adapter.beginQuery({} as WebGLQuery)).not.toThrow();
    expect(() => adapter.endQuery()).not.toThrow();
    expect(() => adapter.deleteQuery({} as WebGLQuery)).not.toThrow();
    expect(adapter.getResultAvailable({} as WebGLQuery)).toBe(false);
    expect(adapter.getResult({} as WebGLQuery)).toBeNull();
  });

  it("returns real values when the extension is available (mocked)", () => {
    const mockQuery = { __queryId: 1 } as unknown as WebGLQuery;
    const mockExt = {
      TIME_ELAPSED_EXT: 0x88bf,
      GPU_DISJOINT_EXT: 0x8fbb,
    };

    const beginQuery = vi.fn();
    const endQuery = vi.fn();
    const getQueryParameter = vi.fn((_query, param) => {
      if (param === QUERY_RESULT_AVAILABLE) return true;
      if (param === QUERY_RESULT) return 4_500_000; // 4.5ms in nanoseconds
      return null;
    });
    const getParameter = vi.fn().mockReturnValue(false);
    const createQuery = vi.fn().mockReturnValue(mockQuery);
    const deleteQuery = vi.fn();

    const QUERY_RESULT_AVAILABLE = 0x9117;
    const QUERY_RESULT = 0x8866;

    const gl = {
      getExtension: vi.fn().mockReturnValue(mockExt),
      createQuery,
      deleteQuery,
      getQueryParameter,
      getParameter,
      beginQuery,
      endQuery,
      QUERY_RESULT_AVAILABLE,
      QUERY_RESULT,
    } as unknown as WebGL2RenderingContext;

    const adapter = new GpuTimingAdapter(gl);
    expect(adapter.isAvailable()).toBe(true);

    const query = adapter.createQuery();
    expect(query).toBe(mockQuery);
    expect(createQuery).toHaveBeenCalled();

    adapter.beginQuery(query as WebGLQuery);
    expect(beginQuery).toHaveBeenCalledWith(mockExt.TIME_ELAPSED_EXT, query);

    adapter.endQuery();
    expect(endQuery).toHaveBeenCalledWith(mockExt.TIME_ELAPSED_EXT);

    expect(adapter.getResultAvailable(query as WebGLQuery)).toBe(true);
    expect(getQueryParameter).toHaveBeenCalledWith(query, QUERY_RESULT_AVAILABLE);

    const result = adapter.getResult(query as WebGLQuery);
    expect(result).toBe(4.5); // converted from nanoseconds to milliseconds
    expect(getQueryParameter).toHaveBeenCalledWith(query, QUERY_RESULT);
    expect(getParameter).toHaveBeenCalledWith(mockExt.GPU_DISJOINT_EXT);

    adapter.deleteQuery(query as WebGLQuery);
    expect(deleteQuery).toHaveBeenCalledWith(query);
  });
});

describe("RendererBudgets", () => {
  it("has importable constants with correct values", () => {
    expect(RendererBudgets.FRAME_P95_MS).toEqual({
      value: 16.6,
      unit: "ms",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.FRAME_P99_MS).toEqual({
      value: 33,
      unit: "ms",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.DRAW_CALLS_MAX).toEqual({
      value: 150,
      unit: "count",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.OPTIMIZED_DRAW_CALLS_MAX).toEqual({
      value: 75,
      unit: "count",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.CHUNK_UPLOAD_BUDGET_MS).toEqual({
      value: 2,
      unit: "ms",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.SNAPSHOT_INGEST_MS).toEqual({
      value: 1,
      unit: "ms",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.VISIBLE_ENTITIES_MAX).toEqual({
      value: 200,
      unit: "count",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.RENDER_CACHED_STRESS_MAX).toEqual({
      value: 1000,
      unit: "count",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.VISIBLE_INSTANCED_PROPS_MAX).toEqual({
      value: 5000,
      unit: "count",
      gate: BudgetGateType.CI_ENFORCEABLE,
    });
    expect(RendererBudgets.STRESS_INSTANCED_PROPS_MAX).toEqual({
      value: 30000,
      unit: "count",
      gate: BudgetGateType.MANUAL_BROWSER_ONLY,
    });
    expect(RendererBudgets.HEAP_STABLE_SLOPE_MB_PER_MIN).toEqual({
      value: 1,
      unit: "MB/min",
      gate: BudgetGateType.MANUAL_BROWSER_ONLY,
    });
  });
});

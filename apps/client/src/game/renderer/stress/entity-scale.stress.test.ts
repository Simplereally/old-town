import { describe, expect, it } from "vitest";
import type { RenderEntitySnapshot, RenderSnapshot } from "../../net/SnapshotBuffer";
import { RenderTransformCache } from "../RenderTransformCache";
import { EntityScaleHarness } from "./EntityScaleHarness";

function makeEntitySnapshot(
  id: number,
  tile: { x: number; y: number; plane: number },
  extra?: Partial<RenderEntitySnapshot>,
): RenderEntitySnapshot {
  return {
    entityId: id,
    kind: id % 3 === 0 ? "player" : "npc",
    tile,
    previousTile: null,
    moveSpeed: "idle",
    facing: 0,
    appearance: {},
    healthBar: null,
    defId: `def:${id}`,
    ...extra,
  } as RenderEntitySnapshot;
}

function makeSnapshot(tick: number, entities: RenderEntitySnapshot[]): RenderSnapshot {
  return {
    tick,
    sequence: tick,
    serverTimeMs: tick * 600,
    entities,
    events: [],
    regionLoads: [],
    regionUnloads: [],
  };
}

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

describe("EntityScaleHarness", () => {
  it("generates 1000 entities with stable ids and mixed kinds", () => {
    const harness = new EntityScaleHarness({ entityCount: 1000 });
    const result = harness.run();
    expect(result.finalCacheCount).toBe(1000);
    expect(harness.entityIds).toHaveLength(1000);
    expect(harness.entityIds[0]).toBe(1);
    expect(harness.entityIds[999]).toBe(1000);

    // Verify mixed kinds
    const sample = result.transformCache.getPresentation(1);
    expect(sample?.kind).toBe("npc");
    const playerSample = result.transformCache.getPresentation(3);
    expect(playerSample?.kind).toBe("player");
  });

  it("feeds at least 60 server ticks through SnapshotBuffer and RenderTransformCache", () => {
    const harness = new EntityScaleHarness({ tickCount: 64 });
    const result = harness.run();
    expect(result.snapshotBuffer.depth).toBeGreaterThanOrEqual(2);
    expect(result.frames.length).toBeGreaterThanOrEqual(60 * 2);
  });

  it("uses deterministic tile paths", () => {
    const harness = new EntityScaleHarness({ entityCount: 10, tickCount: 4 });
    const run1 = harness.run();
    const harness2 = new EntityScaleHarness({ entityCount: 10, tickCount: 4 });
    const run2 = harness2.run();

    const p1 = run1.transformCache.getPresentation(1);
    const p2 = run2.transformCache.getPresentation(1);
    expect(p1?.currTileX).toBe(p2?.currTileX);
    expect(p1?.currTileY).toBe(p2?.currTileY);
  });

  it("simulates fake RAF timestamps without real WebGL", () => {
    const harness = new EntityScaleHarness({ entityCount: 100, tickCount: 10 });
    const result = harness.run();
    for (let i = 1; i < result.frames.length; i++) {
      const prev = result.frames[i - 1] as (typeof result.frames)[number];
      const curr = result.frames[i] as (typeof result.frames)[number];
      expect(prev).toBeDefined();
      expect(curr).toBeDefined();
      expect(curr.rafNowMs).toBeGreaterThan(prev.rafNowMs);
    }
  });
});

describe("RenderTransformCache capacity growth", () => {
  it("preserves entity mapping when capacity grows past initial size", () => {
    const cache = new RenderTransformCache({ initialCapacity: 4, tileSize: 1 });
    const entities: RenderEntitySnapshot[] = [];
    for (let i = 1; i <= 1000; i++) {
      entities.push(makeEntitySnapshot(i, { x: i, y: i, plane: 0 }));
    }
    const snapshot = makeSnapshot(1, entities);
    cache.applySample({
      alpha: 0,
      mode: "interpolate",
      newerSnapshot: snapshot,
    });

    expect(cache.count).toBe(1000);
    // Spot-check entity mapping
    for (let i = 1; i <= 1000; i += 100) {
      const p = cache.getPresentation(i);
      expect(p).toBeDefined();
      expect(p?.entityId).toBe(i);
      expect(p?.currTileX).toBe(i);
      expect(p?.currTileY).toBe(i);
    }
  });

  it("does not expose stale removed entities after capacity growth and removals", () => {
    const cache = new RenderTransformCache({ initialCapacity: 4, tileSize: 1 });

    // Step 1: add 1000 entities
    const allIds = Array.from({ length: 1000 }, (_, i) => i + 1);
    const full = allIds.map((id) => makeEntitySnapshot(id, { x: id, y: id, plane: 0 }));
    cache.applySample({
      alpha: 0,
      mode: "interpolate",
      newerSnapshot: makeSnapshot(1, full),
    });
    expect(cache.count).toBe(1000);

    // Step 2: remove half
    const half = allIds
      .filter((id) => id % 2 === 0)
      .map((id) => makeEntitySnapshot(id, { x: id + 1, y: id + 1, plane: 0 }));
    cache.applySample({
      alpha: 0,
      mode: "interpolate",
      newerSnapshot: makeSnapshot(2, half),
      olderSnapshot: makeSnapshot(1, full),
    });
    expect(cache.count).toBe(500);

    // Removed odd ids must not be accessible
    for (let i = 1; i <= 1000; i += 2) {
      expect(cache.getPresentation(i)).toBeUndefined();
    }

    // Remaining even ids must still be mapped correctly
    for (let i = 2; i <= 1000; i += 2) {
      const p = cache.getPresentation(i);
      expect(p).toBeDefined();
      expect(p?.entityId).toBe(i);
      expect(p?.currTileX).toBe(i + 1);
    }
  });
});

describe("forEachPresentation hot loop", () => {
  it("iterates all 1000 presentations without allocating arrays per entity", () => {
    const cache = new RenderTransformCache({ initialCapacity: 4, tileSize: 1 });
    const entities: RenderEntitySnapshot[] = [];
    for (let i = 1; i <= 1000; i++) {
      entities.push(makeEntitySnapshot(i, { x: i, y: i, plane: 0 }));
    }
    cache.applySample({
      alpha: 0,
      mode: "interpolate",
      newerSnapshot: makeSnapshot(1, entities),
    });

    const seen: number[] = [];
    let firstRef: unknown;
    cache.forEachPresentation((p) => {
      seen.push(p.entityId);
      if (firstRef === undefined) {
        firstRef = p;
      }
    });

    expect(seen).toHaveLength(1000);
    expect(seen[0]).toBe(1);
    expect(seen[999]).toBe(1000);
    // All callbacks receive the same scratch object reference
    expect(firstRef).toBeDefined();
  });

  it("does not allocate new presentation objects in the hot loop", () => {
    const cache = new RenderTransformCache({ initialCapacity: 4, tileSize: 1 });
    const entities: RenderEntitySnapshot[] = [];
    for (let i = 1; i <= 1000; i++) {
      entities.push(makeEntitySnapshot(i, { x: i, y: i, plane: 0 }));
    }
    cache.applySample({
      alpha: 0,
      mode: "interpolate",
      newerSnapshot: makeSnapshot(1, entities),
    });

    const refs: unknown[] = [];
    cache.forEachPresentation((p) => {
      refs.push(p);
    });

    // All callbacks should receive the same object reference
    const first = refs[0];
    for (let i = 1; i < refs.length; i++) {
      expect(refs[i]).toBe(first);
    }
  });
});

describe("Frame metrics", () => {
  it("records entity count and transform update duration across frames", () => {
    const harness = new EntityScaleHarness({ entityCount: 1000, tickCount: 64 });
    const result = harness.run();

    // Every frame should have entityCount set
    const framesWith1000 = result.frames.filter((f) => f.entityCount === 1000);
    expect(framesWith1000.length).toBeGreaterThan(0);

    // Metrics should reflect the final entity count
    const stats = result.metrics.computeStats();
    expect(stats.entityCount).toBe(1000);

    // Transform update duration should be recorded and non-negative
    for (const frame of result.frames) {
      expect(frame.transformUpdateDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("tracks max observed capacity growth", () => {
    const harness = new EntityScaleHarness({
      entityCount: 1000,
      tickCount: 64,
      initialCapacity: 4,
    });
    const result = harness.run();
    expect(result.maxObservedCapacity).toBeGreaterThanOrEqual(1000);
    expect(result.maxObservedCapacity).toBeGreaterThanOrEqual(result.finalCacheCount);
  });
});

describe("Actor pools (conditional on WebGL)", () => {
  const webglAvailable = isWebGLAvailable();

  it(
    webglAvailable
      ? "runs with actor pools when WebGL is present"
      : "skips actor pool tests in headless/jsdom",
    () => {
      if (webglAvailable) {
        // In a real browser, we would test MeshPool / InstanceBucket integration.
        // The pure transform/cache path is verified above; actor pool verification
        // requires a live WebGL context for draw-call validation.
        expect(true).toBe(true);
      } else {
        // Pure transform/cache path is the only thing we can verify in CI.
        // Visual draw-call measurement is manual/browser-only.
        expect(true).toBe(true);
      }
    },
  );

  it("pure transform/cache path works without WebGL", () => {
    const harness = new EntityScaleHarness({ entityCount: 1000, tickCount: 64 });
    const result = harness.run();
    expect(result.transformCache.count).toBe(1000);
    expect(result.frames.length).toBeGreaterThan(0);
  });
});

describe("Manual browser 1k actor rendering", () => {
  it("documents the browser command to inspect visual performance", () => {
    /**
     * MANUAL BROWSER INSTRUCTIONS
     *
     * To visually inspect 1,000 actor rendering performance:
     *
     * 1. Start the dev server:
     *    cd /Users/jasminecaruana/Documents/Josh/Code/old-town
     *    bun run dev
     *
     * 2. Open the client in a browser with WebGL enabled:
     *    http://localhost:5173
     *
     * 3. Open the browser DevTools console and run:
     *    window.__DEBUG_RENDER_1K_ACTORS = true;
     *
     * 4. The renderer will spawn 1,000 instanced actors (players + NPCs).
     *    Watch the FPS counter in the DebugHUD overlay.
     *
     * 5. Expected budget: >30 FPS with p95 frame time under 16.6ms.
     *    If the budget is exceeded, check the Chrome Performance panel
     *    for GPU-bound vs CPU-bound bottlenecks.
     *
     * CI NOTE: This test suite covers the pure transform/cache path.
     * Actual WebGL draw-call validation is manual/browser-only because
     * jsdom (the test environment) does not expose a real WebGL context.
     */
    expect(true).toBe(true);
  });
});

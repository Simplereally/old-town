import { describe, expect, it } from "vitest";
import { SnapshotJitterHarness } from "./SnapshotJitterHarness";

describe("SnapshotJitterHarness", () => {
  it("generates a deterministic path over at least 120 ticks", () => {
    const harness = new SnapshotJitterHarness({ seed: 42, tickCount: 120 });
    harness.run();
    expect(harness.path.length).toBe(121); // 0..120 inclusive
    const start = harness.path[0];
    expect(start).toBeDefined();
    expect(start).toEqual({ x: 0, y: 0, plane: 0 });
    const end = harness.path[harness.path.length - 1];
    expect(end).toBeDefined();
  });

  it("produces a seeded deterministic schedule", () => {
    const h1 = new SnapshotJitterHarness({ seed: 42, tickCount: 120 });
    const h2 = new SnapshotJitterHarness({ seed: 42, tickCount: 120 });
    h1.run();
    h2.run();
    expect(h1.arrivals.length).toBe(h2.arrivals.length);
    expect(h1.arrivals.map((a) => a.tick)).toEqual(h2.arrivals.map((a) => a.tick));
    expect(h1.arrivals.map((a) => a.arrivalTimeMs)).toEqual(
      h2.arrivals.map((a) => a.arrivalTimeMs),
    );
    expect(h1.records.map((r) => r.bufferSample.mode)).toEqual(
      h2.records.map((r) => r.bufferSample.mode),
    );
  });

  it("does not require a real WebGL context", () => {
    const harness = new SnapshotJitterHarness({ seed: 42, tickCount: 10 });
    harness.run();
    expect(harness.records.length).toBeGreaterThan(0);
    expect(harness.transformCache.count).toBeGreaterThanOrEqual(0);
  });
});

describe("Snapshot Jitter Stress", () => {
  it("no stale packet mutates accepted state", () => {
    const harness = new SnapshotJitterHarness({
      seed: 42,
      tickCount: 120,
      jitterMs: 100,
      duplicateRate: 0.1,
      dropRate: 0.1,
      reorderRate: 0.1,
    });
    harness.run();

    // latestAcceptedTick must never decrease
    for (let i = 1; i < harness.records.length; i++) {
      const prev = harness.records[i - 1];
      const curr = harness.records[i];
      if (prev === undefined || curr === undefined) continue;
      expect(curr.latestAcceptedTick).toBeGreaterThanOrEqual(prev.latestAcceptedTick);
    }

    // When a packet is rejected in a frame, the accepted tick must not change
    // because that frame (unless another packet in the same frame was accepted)
    for (let i = 0; i < harness.records.length; i++) {
      const record = harness.records[i];
      if (!record) continue;
      if (record.rejectedPacketTicks.length > 0 && record.acceptedPacketTicks.length === 0) {
        const prev = i > 0 ? harness.records[i - 1] : null;
        if (prev) {
          expect(record.latestAcceptedTick).toBe(prev.latestAcceptedTick);
        }
      }
    }

    // Rejected packets are always stale (tick <= latestAcceptedTick at that moment)
    for (const record of harness.records) {
      for (const rejectedTick of record.rejectedPacketTicks) {
        expect(rejectedTick).toBeLessThanOrEqual(record.latestAcceptedTick);
      }
    }
  });

  it("presentation mode distribution includes normal interpolation and expected hold/freeze/snap modes under configured drops", () => {
    const harness = new SnapshotJitterHarness({
      seed: 42,
      tickCount: 120,
      jitterMs: 150,
      duplicateRate: 0.05,
      dropRate: 0.15,
      reorderRate: 0.05,
    });
    harness.run();

    const modes = new Set<string>();
    const modeCounts: Record<string, number> = {};
    for (const record of harness.records) {
      const mode = record.bufferSample.mode;
      modes.add(mode);
      modeCounts[mode] = (modeCounts[mode] ?? 0) + 1;
    }

    expect(modes.has("interpolate")).toBe(true);
    expect(modes.has("hold_latest")).toBe(true);
    // With 15% drops we should hit freeze or snap at least once
    expect(modes.has("freeze") || modes.has("snap")).toBe(true);
  });

  it("render positions never exceed configured snap thresholds without producing mode: 'snap'", () => {
    const harness = new SnapshotJitterHarness({
      seed: 42,
      tickCount: 120,
      jitterMs: 150,
      dropRate: 0.15,
      snapAfterMissingTicks: 6,
    });
    harness.run();

    for (const record of harness.records) {
      const mode = record.bufferSample.mode;
      const targetTick = record.clockSample.renderServerTimeMs / harness.options.tickMs;
      const newestTick = record.bufferSample.newerTick;

      if (mode === "empty") continue;
      if (mode === "interpolate") {
        // Interpolate mode means two bracketing snapshots exist; no gap issue
        continue;
      }

      // Non-interpolate modes: compute gap from render time to newest snapshot
      const gapTicks = targetTick - newestTick;
      if (gapTicks >= harness.options.snapAfterMissingTicks) {
        // If gap exceeds snap threshold, mode MUST be snap
        expect(mode).toBe("snap");
      }

      // Conversely, if mode is not snap, gap must be below snap threshold
      if (mode !== "snap") {
        expect(gapTicks).toBeLessThan(harness.options.snapAfterMissingTicks);
      }
    }
  });

  it("local authoritative ticks are not invented between packet arrivals", () => {
    const harness = new SnapshotJitterHarness({
      seed: 42,
      tickCount: 120,
      jitterMs: 100,
      dropRate: 0.1,
    });
    harness.run();

    for (let i = 0; i < harness.records.length; i++) {
      const record = harness.records[i];
      if (!record) continue;
      if (record.acceptedPacketTicks.length === 0) {
        const prev = i > 0 ? harness.records[i - 1] : null;
        if (prev) {
          // When no packet arrives, lastSyncTick must stay the same
          expect(record.lastSyncTick).toBe(prev.lastSyncTick);
        }
      }
    }

    // Also verify that lastSyncTick only advances to accepted packet ticks
    for (let i = 1; i < harness.records.length; i++) {
      const prev = harness.records[i - 1];
      const curr = harness.records[i];
      if (prev === undefined || curr === undefined) continue;
      if (curr.lastSyncTick > prev.lastSyncTick) {
        expect(curr.acceptedPacketTicks.length).toBeGreaterThan(0);
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { type RenderSnapshot, SnapshotBuffer, type SnapshotBufferOptions } from "./SnapshotBuffer";

const defaultOptions: SnapshotBufferOptions = {
  tickMs: 600,
  interpolationDelayMs: 600,
  maxSnapshots: 32,
  freezeAfterMissingTicks: 2,
  snapAfterMissingTicks: 6,
};

function makeSnapshot(
  tick: number,
  sequence: number = tick,
  extra?: Partial<RenderSnapshot>,
): RenderSnapshot {
  return {
    tick,
    sequence,
    serverTimeMs: tick * 600,
    entities: [],
    events: [],
    regionLoads: [],
    regionUnloads: [],
    ...extra,
  };
}

describe("SnapshotBuffer", () => {
  it("returns empty before any snapshot", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    const sample = buffer.sample(0);
    expect(sample.mode).toBe("empty");
    expect(sample.olderTick).toBe(-1);
    expect(sample.newerTick).toBe(-1);
    expect(sample.alpha).toBe(0);
  });

  it("accepts a snapshot and tracks latestAcceptedTick", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    expect(buffer.insert(makeSnapshot(1))).toBe(true);
    expect(buffer.latestAcceptedTick).toBe(1);
    expect(buffer.depth).toBe(1);
  });

  it("rejects duplicate tick+sequence", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    const snap = makeSnapshot(5, 5);
    expect(buffer.insert(snap)).toBe(true);
    expect(buffer.insert(snap)).toBe(false);
    expect(buffer.depth).toBe(1);
  });

  it("rejects older tick", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5));
    expect(buffer.insert(makeSnapshot(4))).toBe(false);
    expect(buffer.depth).toBe(1);
  });

  it("rejects same tick older sequence", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5, 5));
    expect(buffer.insert(makeSnapshot(5, 4))).toBe(false);
    expect(buffer.depth).toBe(1);
  });

  it("accepts same tick newer sequence", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5, 5));
    expect(buffer.insert(makeSnapshot(5, 6))).toBe(true);
    expect(buffer.depth).toBe(2);
  });

  it("keeps out-of-order future inserts sorted", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(3));
    expect(buffer.insert(makeSnapshot(1))).toBe(false); // 1 < latestAcceptedTick (3)
    expect(buffer.insert(makeSnapshot(5))).toBe(true);
    expect(buffer.insert(makeSnapshot(2))).toBe(false); // 2 < latestAcceptedTick (5)
    expect(buffer.insert(makeSnapshot(4))).toBe(false); // 4 < latestAcceptedTick (5)
    expect(buffer.insert(makeSnapshot(7))).toBe(true);
    expect(buffer.depth).toBe(3);
    const ticks = buffer.snapshots.map((s) => s.tick);
    expect(ticks).toEqual([3, 5, 7]);
  });

  it("interpolates between two snapshots", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    // At 900ms (1.5 ticks) alpha = 0.5
    const sample = buffer.sample(900);
    expect(sample.mode).toBe("interpolate");
    expect(sample.olderTick).toBe(1);
    expect(sample.newerTick).toBe(2);
    expect(sample.alpha).toBe(0.5);
  });

  it("interpolates alpha at boundaries", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    const atStart = buffer.sample(600);
    expect(atStart.alpha).toBe(0);
    const atEnd = buffer.sample(1200);
    expect(atEnd.alpha).toBe(1);
  });

  it("holds latest when target is slightly ahead (short gap)", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    // 0.5 tick gap = 300ms ahead of latest tick (1200ms)
    const sample = buffer.sample(1500);
    expect(sample.mode).toBe("hold_latest");
    expect(sample.olderTick).toBe(2);
    expect(sample.newerTick).toBe(2);
  });

  it("interpolates at exactly the latest tick when pair exists", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    const sample = buffer.sample(1200);
    expect(sample.mode).toBe("interpolate");
    expect(sample.olderTick).toBe(1);
    expect(sample.newerTick).toBe(2);
    expect(sample.alpha).toBe(1);
  });

  it("freezes when gap exceeds freeze threshold", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    // 2.5 tick gap = 1500ms ahead of latest tick (1200ms)
    const sample = buffer.sample(2700);
    expect(sample.mode).toBe("freeze");
    expect(sample.olderTick).toBe(2);
    expect(sample.newerTick).toBe(2);
    expect(sample.snapReason).toContain("Missing");
  });

  it("snaps when gap exceeds snap threshold", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    // 6.5 tick gap = 3900ms ahead of latest tick (1200ms)
    const sample = buffer.sample(5100);
    expect(sample.mode).toBe("snap");
    expect(sample.olderTick).toBe(2);
    expect(sample.newerTick).toBe(2);
    expect(sample.snapReason).toContain("snap threshold");
  });

  it("freezes at exactly freeze threshold", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    // exactly 2 tick gap = 1200ms ahead of latest tick (1200ms)
    const sample = buffer.sample(2400);
    expect(sample.mode).toBe("freeze");
  });

  it("snaps at exactly snap threshold", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    // exactly 6 tick gap = 3600ms ahead of latest tick (1200ms)
    const sample = buffer.sample(4800);
    expect(sample.mode).toBe("snap");
  });

  it("reset clears snapshots and sets baseline", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    buffer.reset(makeSnapshot(10));
    expect(buffer.latestAcceptedTick).toBe(10);
    expect(buffer.depth).toBe(1);
    const sample = buffer.sample(6000);
    expect(sample.mode).toBe("hold_latest");
    expect(sample.olderTick).toBe(10);
  });

  it("reset restarts accepted tick ordering", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5));
    buffer.reset(makeSnapshot(1));
    expect(buffer.insert(makeSnapshot(2))).toBe(true);
    expect(buffer.insert(makeSnapshot(0))).toBe(false);
    expect(buffer.latestAcceptedTick).toBe(2);
  });

  it("trims oldest snapshots after exceeding max", () => {
    const buffer = new SnapshotBuffer({ ...defaultOptions, maxSnapshots: 8 });
    for (let i = 1; i <= 12; i++) {
      buffer.insert(makeSnapshot(i));
    }
    expect(buffer.depth).toBe(8);
    const ticks = buffer.snapshots.map((s) => s.tick);
    expect(ticks).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("preserves minimum snapshots during trim", () => {
    const buffer = new SnapshotBuffer({ ...defaultOptions, maxSnapshots: 1 });
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(2));
    buffer.insert(makeSnapshot(3));
    expect(buffer.depth).toBe(2); // minToKeep = ceil(600/600)+1 = 2
  });

  it("holds before first snapshot when target is earlier", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(3));
    const sample = buffer.sample(0);
    expect(sample.mode).toBe("hold_latest");
    expect(sample.olderTick).toBe(3);
  });

  it("handles single snapshot hold_latest", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5));
    const sample = buffer.sample(3000);
    expect(sample.mode).toBe("hold_latest");
    expect(sample.olderTick).toBe(5);
    expect(sample.newerTick).toBe(5);
  });

  it("handles single snapshot freeze after threshold", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5));
    const sample = buffer.sample(4000); // 5 ticks = 3000ms, target 4000ms => gap = 4000/600 - 5 = 1.67
    expect(sample.mode).toBe("hold_latest");
    const freezeSample = buffer.sample(5000); // gap = 3.33
    expect(freezeSample.mode).toBe("freeze");
  });

  it("handles single snapshot snap after threshold", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(5));
    const sample = buffer.sample(8000); // gap = 8.33
    expect(sample.mode).toBe("snap");
  });

  it("interpolates with non-consecutive ticks", () => {
    const buffer = new SnapshotBuffer(defaultOptions);
    buffer.insert(makeSnapshot(1));
    buffer.insert(makeSnapshot(3)); // gap of 1 tick
    // target = 2 ticks = 1200ms
    const sample = buffer.sample(1200);
    expect(sample.mode).toBe("interpolate");
    expect(sample.olderTick).toBe(1);
    expect(sample.newerTick).toBe(3);
    expect(sample.alpha).toBe(0.5);
  });
});

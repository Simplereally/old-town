import { describe, expect, it } from "vitest";
import { RenderClock, type RenderClockOptions } from "./RenderClock";

const defaultOptions: RenderClockOptions = {
  tickMs: 600,
  interpolationDelayMs: 600,
  maxFrameDeltaMs: 100,
  serverTimeSmoothing: 0.1,
};

describe("RenderClock", () => {
  it("first sample after sync produces render time one interpolation delay behind estimated", () => {
    const clock = new RenderClock(defaultOptions);
    const rafNowMs = 1000;
    const packetServerTimeMs = 2000;
    clock.syncToServer(1, packetServerTimeMs, rafNowMs);
    const sample = clock.sample(rafNowMs);
    expect(sample.estimatedServerTimeMs).toBe(packetServerTimeMs);
    expect(sample.renderServerTimeMs).toBe(
      packetServerTimeMs - defaultOptions.interpolationDelayMs,
    );
    expect(sample.rafNowMs).toBe(rafNowMs);
    expect(sample.frameDeltaMs).toBe(0);
    expect(sample.clamped).toBe(false);
  });

  it("60Hz produces ~16.67ms frame deltas", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    const t1 = 1000;
    const t2 = 1000 + 1000 / 60;
    clock.sample(t1);
    const sample = clock.sample(t2);
    expect(sample.frameDeltaMs).toBeCloseTo(1000 / 60, 1);
    expect(sample.clamped).toBe(false);
  });

  it("75Hz produces ~13.33ms frame deltas", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    const t1 = 1000;
    const t2 = 1000 + 1000 / 75;
    clock.sample(t1);
    const sample = clock.sample(t2);
    expect(sample.frameDeltaMs).toBeCloseTo(1000 / 75, 1);
    expect(sample.clamped).toBe(false);
  });

  it("120Hz produces ~8.33ms frame deltas", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    const t1 = 1000;
    const t2 = 1000 + 1000 / 120;
    clock.sample(t1);
    const sample = clock.sample(t2);
    expect(sample.frameDeltaMs).toBeCloseTo(1000 / 120, 1);
    expect(sample.clamped).toBe(false);
  });

  it("144Hz produces ~6.94ms frame deltas", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    const t1 = 1000;
    const t2 = 1000 + 1000 / 144;
    clock.sample(t1);
    const sample = clock.sample(t2);
    expect(sample.frameDeltaMs).toBeCloseTo(1000 / 144, 1);
    expect(sample.clamped).toBe(false);
  });

  it("long paused frame is clamped to maxFrameDeltaMs", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    clock.sample(1000);
    const sample = clock.sample(1000 + 5000); // 5-second pause
    expect(sample.frameDeltaMs).toBe(defaultOptions.maxFrameDeltaMs);
    expect(sample.clamped).toBe(true);
  });

  it("does not advance local authoritative tick counter", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    const sample = clock.sample(1000 + 1200); // 1200 ms = 2 ticks
    // Estimated server time should be continuous, not tick-quantised.
    expect(sample.estimatedServerTimeMs).toBe(2000 + 1200);
    expect(sample.renderServerTimeMs).toBe(2000 + 1200 - defaultOptions.interpolationDelayMs);
  });

  it("repeated sync smooths offset forward without moving backwards", () => {
    const clock = new RenderClock(defaultOptions);
    // First sync: offset = 1000
    clock.syncToServer(1, 2000, 1000);
    clock.sample(1000);
    // Second sync: raw offset = 1005, smoothed = 1000 * 0.9 + 1005 * 0.1 = 1000.5
    clock.syncToServer(2, 2005, 1000);
    const sample = clock.sample(1000);
    expect(sample.estimatedServerTimeMs).toBe(1000 + 1000.5);
    expect(sample.estimatedServerTimeMs).toBeGreaterThanOrEqual(2000);
  });

  it("does not move render time backwards on late sync", () => {
    const clock = new RenderClock(defaultOptions);
    // First sync: offset = 1000
    clock.syncToServer(1, 2000, 1000);
    clock.sample(1000);
    // Second sync suggests a smaller offset: raw offset = 900
    // With smoothing: smoothed = 1000 * 0.9 + 900 * 0.1 = 990
    // Math.max keeps it at 1000, so render time does not move backwards.
    clock.syncToServer(2, 2500, 1600);
    const sample = clock.sample(2000);
    expect(sample.estimatedServerTimeMs).toBe(3000);
    expect(sample.renderServerTimeMs).toBe(3000 - defaultOptions.interpolationDelayMs);
  });

  it("returns zero frameDeltaMs on the very first sample", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    const sample = clock.sample(1000);
    expect(sample.frameDeltaMs).toBe(0);
    expect(sample.clamped).toBe(false);
  });

  it("tracks lastSyncTick", () => {
    const clock = new RenderClock(defaultOptions);
    expect(clock.lastSyncTick).toBe(-1);
    clock.syncToServer(7, 2000, 1000);
    expect(clock.lastSyncTick).toBe(7);
  });

  it("works before any sync using rafNowMs as fallback server time", () => {
    const clock = new RenderClock(defaultOptions);
    const sample = clock.sample(500);
    expect(sample.rafNowMs).toBe(500);
    expect(sample.estimatedServerTimeMs).toBe(500);
    expect(sample.renderServerTimeMs).toBe(500 - defaultOptions.interpolationDelayMs);
    expect(sample.frameDeltaMs).toBe(0);
  });

  it("handles exact boundary at maxFrameDeltaMs without clamping", () => {
    const clock = new RenderClock(defaultOptions);
    clock.syncToServer(1, 2000, 1000);
    clock.sample(1000);
    const sample = clock.sample(1000 + defaultOptions.maxFrameDeltaMs);
    expect(sample.frameDeltaMs).toBe(defaultOptions.maxFrameDeltaMs);
    expect(sample.clamped).toBe(false);
  });
});

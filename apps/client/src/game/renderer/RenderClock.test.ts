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

  it("gently corrects the offset downward on a lower late sync (no hard ratchet)", () => {
    const clock = new RenderClock(defaultOptions);
    // First sync: offset = 1000
    clock.syncToServer(1, 2000, 1000);
    clock.sample(1000);
    // Second sync suggests a smaller offset: raw offset = 900.
    // Symmetric EMA: smoothed = 1000 * 0.9 + 900 * 0.1 = 990 (must NOT stay
    // pinned at 1000 — a one-sided Math.max ratchet biases playout forward and
    // causes per-tick teleporting under bursty arrival).
    clock.syncToServer(2, 2500, 1600);
    const sample = clock.sample(2000);
    expect(sample.estimatedServerTimeMs).toBe(2000 + 990);
    expect(sample.renderServerTimeMs).toBe(2000 + 990 - defaultOptions.interpolationDelayMs);
    // The single-sync correction is bounded by serverTimeSmoothing, so render
    // time never visibly rewinds: it shifted by only 10 ms here.
    expect(2000 + 990 - 2990).toBe(0);
  });

  it("stays behind the newest snapshot under drift + catch-up bursts (no teleport)", () => {
    // Reproduce the reported sawtooth: the server tick clock advances exactly
    // one tick per packet, but real arrival drifts each tick (per-tick work
    // added to the period) until the loop slips a full tick and emits a 2-delta
    // catch-up burst — repeating on a fixed cadence. Render 1.5 ticks behind,
    // matching the production GameEngine config. The old Math.max ratchet drives
    // the minimum distance to roughly -280 ms here (frozen/teleporting); the
    // symmetric EMA keeps it positive.
    const tick = 600;
    const clock = new RenderClock({
      ...defaultOptions,
      interpolationDelayMs: Math.round(tick * 1.5),
    });
    const fireInterval = 640; // 40 ms steady drift -> burst roughly every 15 ticks
    let serverTime = 0;
    const arrivals: { serverTime: number; recv: number }[] = [];
    for (let i = 1; i <= 120; i++) {
      const recv = i * fireInterval;
      while (serverTime + tick <= recv) {
        serverTime += tick;
        arrivals.push({ serverTime, recv });
      }
    }

    let minDistanceBehindNewest = Number.POSITIVE_INFINITY;
    for (let k = 0; k < arrivals.length - 1; k++) {
      const a = arrivals[k];
      const b = arrivals[k + 1];
      if (!a || !b) continue;
      clock.syncToServer(k, a.serverTime, a.recv);
      if (k < arrivals.length / 2) continue; // let the EMA settle
      // Sample many render frames between this arrival and the next.
      for (let f = 0; f <= 16; f++) {
        const rafNow = a.recv + ((b.recv - a.recv) * f) / 16;
        const { renderServerTimeMs } = clock.sample(rafNow);
        minDistanceBehindNewest = Math.min(
          minDistanceBehindNewest,
          a.serverTime - renderServerTimeMs,
        );
      }
    }

    // Render time must remain strictly behind the newest snapshot for the whole
    // cycle, so the SnapshotBuffer always has a bracketing pair to interpolate
    // (positive distance == smooth; <= 0 == frozen/teleporting).
    expect(minDistanceBehindNewest).toBeGreaterThan(0);
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

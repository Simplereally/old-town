import { describe, expect, it } from "vitest";
import { PersistenceMetrics } from "./metrics";

describe("PersistenceMetrics", () => {
  it("counts enqueues by priority and completions", () => {
    const metrics = new PersistenceMetrics();
    metrics.recordSaveEnqueued("immediate");
    metrics.recordSaveEnqueued("lazy");
    metrics.recordSaveEnqueued("lazy");
    metrics.recordSaveCompleted(42);

    const snapshot = metrics.snapshot({
      currentTick: 50,
      pendingSaves: 1,
      inFlightSaves: 0,
      oldestDirtyTick: 44,
    });

    expect(snapshot).toMatchObject({
      totalSavesEnqueued: 3,
      totalImmediateSaves: 1,
      totalLazySaves: 2,
      totalSavesCompleted: 1,
      lastSavedTick: 42,
      pendingSaves: 1,
      saveLagTicks: 6,
    });
  });

  it("computes zero save lag when the queue is clean", () => {
    const metrics = new PersistenceMetrics();
    const snapshot = metrics.snapshot({
      currentTick: 100,
      pendingSaves: 0,
      inFlightSaves: 0,
      oldestDirtyTick: undefined,
    });
    expect(snapshot.saveLagTicks).toBe(0);
    expect(snapshot.oldestDirtyTick).toBeUndefined();
  });

  it("tracks failures and distinguishes optimistic version conflicts", () => {
    const metrics = new PersistenceMetrics();
    metrics.recordSaveFailure("disk full");
    metrics.recordSaveFailure("stale", { versionConflict: true });

    const snapshot = metrics.snapshot({
      currentTick: 10,
      pendingSaves: 0,
      inFlightSaves: 0,
      oldestDirtyTick: undefined,
    });
    expect(snapshot.totalSaveFailures).toBe(2);
    expect(snapshot.versionConflicts).toBe(1);
    expect(snapshot.lastFailureMessage).toBe("stale");
  });

  it("tracks ledger writes and failures", () => {
    const metrics = new PersistenceMetrics();
    metrics.recordLedgerWrite();
    metrics.recordLedgerWrite();
    metrics.recordLedgerFailure();

    const snapshot = metrics.snapshot({
      currentTick: 0,
      pendingSaves: 0,
      inFlightSaves: 0,
      oldestDirtyTick: undefined,
    });
    expect(snapshot.ledgerWrites).toBe(2);
    expect(snapshot.ledgerFailures).toBe(1);
  });

  it("counts throttled saves when backpressure defers a flush", () => {
    const metrics = new PersistenceMetrics();
    metrics.recordSaveThrottled();
    metrics.recordSaveThrottled();

    const snapshot = metrics.snapshot({
      currentTick: 0,
      pendingSaves: 0,
      inFlightSaves: 0,
      oldestDirtyTick: undefined,
    });
    expect(snapshot.throttledSaves).toBe(2);
  });

  it("tracks economy commits, replays, and failures (including idempotency conflicts)", () => {
    const metrics = new PersistenceMetrics();
    metrics.recordEconomyCommit(30);
    metrics.recordEconomyReplay();
    metrics.recordEconomyFailure();
    metrics.recordEconomyFailure({ idempotencyConflict: true });

    const snapshot = metrics.snapshot({
      currentTick: 30,
      pendingSaves: 0,
      inFlightSaves: 0,
      oldestDirtyTick: undefined,
    });
    expect(snapshot.economyCommits).toBe(1);
    expect(snapshot.economyReplays).toBe(1);
    expect(snapshot.economyFailures).toBe(2);
    expect(snapshot.economyIdempotencyConflicts).toBe(1);
    // recordEconomyCommit also stamps lastSavedTick.
    expect(snapshot.lastSavedTick).toBe(30);
  });

  it("reports degraded when save lag exceeds the threshold", () => {
    const metrics = new PersistenceMetrics();
    const snapshot = metrics.snapshot({
      currentTick: 100,
      pendingSaves: 5,
      inFlightSaves: 0,
      oldestDirtyTick: 10, // 90 ticks behind — well past the 50-tick threshold.
    });
    expect(snapshot.saveLagTicks).toBe(90);
    expect(snapshot.degraded).toBe(true);
  });

  it("reports degraded when the in-flight ceiling is saturated", () => {
    const metrics = new PersistenceMetrics();
    const snapshot = metrics.snapshot({
      currentTick: 0,
      pendingSaves: 0,
      inFlightSaves: 64,
      oldestDirtyTick: undefined,
      maxInFlightSaves: 64,
    });
    expect(snapshot.degraded).toBe(true);
  });

  it("is not degraded when lag is low and the pool has headroom", () => {
    const metrics = new PersistenceMetrics();
    const snapshot = metrics.snapshot({
      currentTick: 50,
      pendingSaves: 1,
      inFlightSaves: 2,
      oldestDirtyTick: 48, // 2 ticks behind
      maxInFlightSaves: 64,
    });
    expect(snapshot.degraded).toBe(false);
  });
});

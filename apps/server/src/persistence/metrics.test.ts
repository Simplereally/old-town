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
});

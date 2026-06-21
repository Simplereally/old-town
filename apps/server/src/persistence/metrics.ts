/**
 * Persistence subsystem metrics (item 8).
 *
 * Makes save health observable: queue depth, in-flight saves, how many ticks the oldest dirty
 * character is behind durable state, save/ledger throughput, and failure counts (including
 * optimistic version conflicts). The save queue and item-audit log feed counters here; the kernel
 * surfaces a snapshot through `/debug/persistence` and `/debug/stats`.
 *
 * "Character X is 42 ticks behind durable state" is a real, queryable metric.
 */

export interface PersistenceMetricsSnapshot {
  /** Characters waiting to be saved (coalesced queue depth). */
  readonly pendingSaves: number;
  /** Saves currently writing to the store. */
  readonly inFlightSaves: number;
  /** Earliest dirty tick still unsaved, or undefined when the queue is clean. */
  readonly oldestDirtyTick: number | undefined;
  /** currentTick - oldestDirtyTick; 0 when clean. The headline "save lag" number. */
  readonly saveLagTicks: number;
  readonly totalSavesEnqueued: number;
  readonly totalImmediateSaves: number;
  readonly totalLazySaves: number;
  readonly totalSavesCompleted: number;
  readonly totalSaveFailures: number;
  readonly versionConflicts: number;
  /** Saves deferred because the in-flight limit was reached (backpressure, item 9). */
  readonly throttledSaves: number;
  readonly lastSavedTick: number | undefined;
  readonly lastFailureMessage: string | undefined;
  readonly ledgerWrites: number;
  readonly ledgerFailures: number;
  readonly economyCommits: number;
  readonly economyReplays: number;
  readonly economyFailures: number;
  readonly economyIdempotencyConflicts: number;
  /** True when the subsystem is lagging or saturated — surfaced for ops dashboards. */
  readonly degraded: boolean;
}

export interface PersistenceMetricsInput {
  readonly currentTick: number;
  readonly pendingSaves: number;
  readonly inFlightSaves: number;
  readonly oldestDirtyTick: number | undefined;
  /** In-flight ceiling; saturation marks the subsystem degraded. */
  readonly maxInFlightSaves?: number;
}

/** Save lag (ticks behind durable state) past which the subsystem is reported as degraded. */
const DEGRADED_SAVE_LAG_TICKS = 50;

export class PersistenceMetrics {
  private totalSavesEnqueued = 0;
  private totalImmediateSaves = 0;
  private totalLazySaves = 0;
  private totalSavesCompleted = 0;
  private totalSaveFailures = 0;
  private versionConflicts = 0;
  private throttledSaves = 0;
  private lastSavedTick: number | undefined;
  private lastFailureMessage: string | undefined;
  private ledgerWrites = 0;
  private ledgerFailures = 0;
  private economyCommits = 0;
  private economyReplays = 0;
  private economyFailures = 0;
  private economyIdempotencyConflicts = 0;

  recordSaveEnqueued(priority: "immediate" | "lazy"): void {
    this.totalSavesEnqueued += 1;
    if (priority === "immediate") {
      this.totalImmediateSaves += 1;
    } else {
      this.totalLazySaves += 1;
    }
  }

  recordSaveCompleted(tick: number): void {
    this.totalSavesCompleted += 1;
    this.lastSavedTick = tick;
  }

  recordSaveFailure(message: string, options: { readonly versionConflict?: boolean } = {}): void {
    this.totalSaveFailures += 1;
    this.lastFailureMessage = message;
    if (options.versionConflict) {
      this.versionConflicts += 1;
    }
  }

  recordSaveThrottled(): void {
    this.throttledSaves += 1;
  }

  recordLedgerWrite(): void {
    this.ledgerWrites += 1;
  }

  recordLedgerFailure(): void {
    this.ledgerFailures += 1;
  }

  recordEconomyCommit(tick: number): void {
    this.economyCommits += 1;
    this.lastSavedTick = tick;
  }

  recordEconomyReplay(): void {
    this.economyReplays += 1;
  }

  recordEconomyFailure(options: { readonly idempotencyConflict?: boolean } = {}): void {
    this.economyFailures += 1;
    if (options.idempotencyConflict) {
      this.economyIdempotencyConflicts += 1;
    }
  }

  snapshot(input: PersistenceMetricsInput): PersistenceMetricsSnapshot {
    const saveLagTicks =
      input.oldestDirtyTick === undefined
        ? 0
        : Math.max(0, input.currentTick - input.oldestDirtyTick);
    const saturated =
      input.maxInFlightSaves !== undefined && input.inFlightSaves >= input.maxInFlightSaves;
    return {
      pendingSaves: input.pendingSaves,
      inFlightSaves: input.inFlightSaves,
      oldestDirtyTick: input.oldestDirtyTick,
      saveLagTicks,
      totalSavesEnqueued: this.totalSavesEnqueued,
      totalImmediateSaves: this.totalImmediateSaves,
      totalLazySaves: this.totalLazySaves,
      totalSavesCompleted: this.totalSavesCompleted,
      totalSaveFailures: this.totalSaveFailures,
      versionConflicts: this.versionConflicts,
      throttledSaves: this.throttledSaves,
      lastSavedTick: this.lastSavedTick,
      lastFailureMessage: this.lastFailureMessage,
      ledgerWrites: this.ledgerWrites,
      ledgerFailures: this.ledgerFailures,
      economyCommits: this.economyCommits,
      economyReplays: this.economyReplays,
      economyFailures: this.economyFailures,
      economyIdempotencyConflicts: this.economyIdempotencyConflicts,
      degraded: saturated || saveLagTicks > DEGRADED_SAVE_LAG_TICKS,
    };
  }
}

import type { ContentRegistries, EntityId, ItemTransactionAuditEvent } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { Logger } from "../logger";
import {
  type PersistenceAdapter,
  PersistenceIdempotencyConflictError,
  PersistenceVersionConflictError,
} from "./adapter";
import { snapshotCharacter } from "./character-state";
import { asEconomyStore, type EconomyCommitInput, type EconomyStore } from "./economy";
import type { PersistenceMetrics } from "./metrics";

export type CharacterSaveReason =
  | "inventory"
  | "equipment"
  | "quest"
  | "level"
  | "death"
  | "bank"
  | "position"
  | "hitpoints"
  | "transient"
  | "economy"
  | "shutdown";

/** Default ceiling on concurrent durable writes — backpressure when the DB lags (item 9). */
const DEFAULT_MAX_IN_FLIGHT_SAVES = 64;
/** How many times to retry a failed atomic economy commit before giving up (and logging loudly). */
const MAX_ECONOMY_RETRIES = 5;

export interface CharacterSaveQueueOptions {
  readonly world: World;
  readonly registries: Pick<ContentRegistries, "item">;
  readonly persistence: PersistenceAdapter;
  readonly resolveCharacterId: (entityId: EntityId) => string | undefined;
  readonly lazySaveIntervalTicks: number;
  readonly logger: Pick<Logger, "debug" | "warn" | "error">;
  /** Optional metrics sink for save lag / throughput / failure observability (item 8). */
  readonly metrics?: PersistenceMetrics;
  /** Max concurrent durable writes; excess pendings wait (item 9). */
  readonly maxInFlightSaves?: number;
}

interface PendingSave {
  readonly entityId: EntityId;
  readonly reasons: Set<CharacterSaveReason>;
  readonly firstDirtyTick: number;
  lastDirtyTick: number;
  dueTick: number;
  immediate: boolean;
  /** Ledger entries to persist atomically with the next snapshot (economy mutations). */
  readonly economyLedger: ItemTransactionAuditEvent[];
  /** Per-mutation idempotency keys that compose this commit's batch key. */
  readonly economyKeys: string[];
}

export class CharacterSaveQueue {
  private readonly pending = new Map<EntityId, PendingSave>();
  private readonly inFlight = new Set<Promise<void>>();
  private readonly economy: EconomyStore | undefined;
  private readonly maxInFlightSaves: number;

  constructor(private readonly options: CharacterSaveQueueOptions) {
    if (!Number.isInteger(options.lazySaveIntervalTicks) || options.lazySaveIntervalTicks < 1) {
      throw new Error("lazySaveIntervalTicks must be a positive integer");
    }
    this.economy = asEconomyStore(options.persistence);
    this.maxInFlightSaves = options.maxInFlightSaves ?? DEFAULT_MAX_IN_FLIGHT_SAVES;
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  get inFlightCount(): number {
    return this.inFlight.size;
  }

  /** Whether the backing adapter supports atomic economy commits (durable snapshot + ledger). */
  get supportsEconomy(): boolean {
    return this.economy !== undefined;
  }

  get maxInFlight(): number {
    return this.maxInFlightSaves;
  }

  /** Earliest tick of any unsaved pending character, or undefined when the queue is clean. */
  get oldestDirtyTick(): number | undefined {
    let oldest: number | undefined;
    for (const pending of this.pending.values()) {
      if (oldest === undefined || pending.firstDirtyTick < oldest) {
        oldest = pending.firstDirtyTick;
      }
    }
    return oldest;
  }

  discard(entityId: EntityId): void {
    this.pending.delete(entityId);
  }

  markImmediate(
    entityId: EntityId,
    reason: CharacterSaveReason,
    tick: number,
    serverTime: number,
  ): void {
    const pending = this.pendingSave(entityId, reason, tick);
    pending.immediate = true;
    pending.dueTick = tick;
    this.options.metrics?.recordSaveEnqueued("immediate");
    this.options.logger.debug("persistence", "Queued immediate character save", {
      entityId,
      reason,
      tick,
      serverTime,
      pendingReasons: [...pending.reasons],
    });
  }

  markLazy(
    entityId: EntityId,
    reason: CharacterSaveReason,
    tick: number,
    serverTime: number,
  ): void {
    const pending = this.pendingSave(entityId, reason, tick);
    pending.lastDirtyTick = tick;
    this.options.metrics?.recordSaveEnqueued("lazy");
    this.options.logger.debug("persistence", "Queued lazy character save", {
      entityId,
      reason,
      tick,
      serverTime,
      dueTick: pending.dueTick,
      pendingReasons: [...pending.reasons],
    });
  }

  /**
   * Mark a dupe-sensitive economic mutation. The next flush persists the character snapshot AND the
   * ledger rows in a single atomic transaction (no split-brain), keyed for exactly-once application.
   */
  markEconomyCommit(
    entityId: EntityId,
    ledger: readonly ItemTransactionAuditEvent[],
    idempotencyKey: string,
    tick: number,
    serverTime: number,
  ): void {
    const pending = this.pendingSave(entityId, "economy", tick);
    pending.immediate = true;
    pending.dueTick = tick;
    pending.economyLedger.push(...ledger);
    pending.economyKeys.push(idempotencyKey);
    this.options.metrics?.recordSaveEnqueued("immediate");
    this.options.logger.debug("persistence", "Queued economy commit", {
      entityId,
      idempotencyKey,
      tick,
      serverTime,
      ledgerEntries: ledger.length,
    });
  }

  flushDue(tick: number, serverTime: number): void {
    for (const pending of [...this.pending.values()]) {
      if (!(pending.immediate || pending.dueTick <= tick)) {
        continue;
      }
      if (this.inFlight.size >= this.maxInFlightSaves) {
        // Backpressure: leave the pending in place (it coalesces) and retry next tick.
        this.options.metrics?.recordSaveThrottled();
        continue;
      }
      this.startSave(pending, tick, serverTime);
    }
  }

  async flushAll(tick: number, serverTime: number): Promise<void> {
    for (const pending of [...this.pending.values()]) {
      pending.reasons.add("shutdown");
      this.startSave(pending, tick, serverTime);
    }
    await Promise.all([...this.inFlight]);
  }

  private pendingSave(entityId: EntityId, reason: CharacterSaveReason, tick: number): PendingSave {
    const existing = this.pending.get(entityId);
    if (existing) {
      existing.reasons.add(reason);
      return existing;
    }
    const pending: PendingSave = {
      entityId,
      reasons: new Set([reason]),
      firstDirtyTick: tick,
      lastDirtyTick: tick,
      dueTick: tick + this.options.lazySaveIntervalTicks,
      immediate: false,
      economyLedger: [],
      economyKeys: [],
    };
    this.pending.set(entityId, pending);
    return pending;
  }

  private startSave(pending: PendingSave, tick: number, serverTime: number): void {
    this.pending.delete(pending.entityId);
    const characterId = this.options.resolveCharacterId(pending.entityId);
    if (!characterId) {
      this.options.logger.warn("persistence", "Skipped character save without character id", {
        entityId: pending.entityId,
        reasons: [...pending.reasons],
      });
      return;
    }
    const snapshot = this.buildSnapshot(pending.entityId, characterId, serverTime);
    if (!snapshot) {
      return;
    }
    this.options.logger.debug("persistence", "Flushing character save", {
      entityId: pending.entityId,
      characterId,
      tick,
      serverTime,
      firstDirtyTick: pending.firstDirtyTick,
      lastDirtyTick: pending.lastDirtyTick,
      reasons: [...pending.reasons],
    });

    if (pending.economyLedger.length > 0 && this.economy) {
      const input: EconomyCommitInput = {
        idempotencyKey: `economy:${characterId}:${[...pending.economyKeys].sort().join("|")}`,
        tick,
        characters: [{ characterId, snapshot }],
        ledger: pending.economyLedger.map((event) => ({ ...event, characterId })),
      };
      this.startEconomyCommit(pending.entityId, characterId, input, tick, 0);
      return;
    }

    this.track(
      this.options.persistence
        .saveCharacter(snapshot)
        .then(() => {
          this.options.metrics?.recordSaveCompleted(tick);
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          this.options.metrics?.recordSaveFailure(message, {
            versionConflict: error instanceof PersistenceVersionConflictError,
          });
          this.options.logger.warn("persistence", "Character save failed", {
            entityId: pending.entityId,
            characterId,
            message,
          });
        }),
    );
  }

  /**
   * Run an atomic economy commit. On failure (other than an idempotency conflict, which is a bug)
   * re-enqueue the SAME captured input so retries hash identically and a partially-observed commit
   * replays safely rather than double-applying.
   */
  private startEconomyCommit(
    entityId: EntityId,
    characterId: string,
    input: EconomyCommitInput,
    tick: number,
    retries: number,
  ): void {
    const economy = this.economy;
    if (!economy) {
      return;
    }
    this.track(
      economy
        .commitItemMutation(input)
        .then((result) => {
          if (result.status === "replayed") {
            this.options.metrics?.recordEconomyReplay();
          } else {
            this.options.metrics?.recordEconomyCommit(tick);
          }
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          const idempotencyConflict = error instanceof PersistenceIdempotencyConflictError;
          this.options.metrics?.recordEconomyFailure({ idempotencyConflict });
          if (idempotencyConflict || retries >= MAX_ECONOMY_RETRIES) {
            this.options.logger.error("persistence", "Economy commit failed permanently", {
              entityId,
              characterId,
              idempotencyKey: input.idempotencyKey,
              retries,
              message,
            });
            return;
          }
          this.options.logger.warn("persistence", "Economy commit failed; will retry", {
            entityId,
            characterId,
            idempotencyKey: input.idempotencyKey,
            retries,
            message,
          });
          this.startEconomyCommit(entityId, characterId, input, tick, retries + 1);
        }),
    );
  }

  private buildSnapshot(entityId: EntityId, characterId: string, serverTime: number) {
    try {
      return snapshotCharacter(
        { world: this.options.world, registries: this.options.registries },
        entityId,
        characterId,
        serverTime,
      );
    } catch (error) {
      this.options.logger.warn("persistence", "Character snapshot failed", {
        entityId,
        characterId,
        message: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private track(promise: Promise<void>): void {
    const tracked = promise.finally(() => {
      this.inFlight.delete(tracked);
    });
    this.inFlight.add(tracked);
  }
}

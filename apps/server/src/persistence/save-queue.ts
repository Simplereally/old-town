import type { ContentRegistries, EntityId } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { Logger } from "../logger";
import type { PersistenceAdapter } from "./adapter";
import { snapshotCharacter } from "./character-state";

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
  | "shutdown";

export interface CharacterSaveQueueOptions {
  readonly world: World;
  readonly registries: Pick<ContentRegistries, "item">;
  readonly persistence: PersistenceAdapter;
  readonly resolveCharacterId: (entityId: EntityId) => string | undefined;
  readonly lazySaveIntervalTicks: number;
  readonly logger: Pick<Logger, "debug" | "warn">;
}

interface PendingSave {
  readonly entityId: EntityId;
  readonly reasons: Set<CharacterSaveReason>;
  readonly firstDirtyTick: number;
  lastDirtyTick: number;
  dueTick: number;
  immediate: boolean;
}

export class CharacterSaveQueue {
  private readonly pending = new Map<EntityId, PendingSave>();
  private readonly inFlight = new Set<Promise<void>>();

  constructor(private readonly options: CharacterSaveQueueOptions) {
    if (!Number.isInteger(options.lazySaveIntervalTicks) || options.lazySaveIntervalTicks < 1) {
      throw new Error("lazySaveIntervalTicks must be a positive integer");
    }
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  get inFlightCount(): number {
    return this.inFlight.size;
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
    this.options.logger.debug("persistence", "Queued lazy character save", {
      entityId,
      reason,
      tick,
      serverTime,
      dueTick: pending.dueTick,
      pendingReasons: [...pending.reasons],
    });
  }

  flushDue(tick: number, serverTime: number): void {
    for (const pending of [...this.pending.values()]) {
      if (pending.immediate || pending.dueTick <= tick) {
        this.startSave(pending, tick, serverTime);
      }
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
    let snapshot: ReturnType<typeof snapshotCharacter>;
    try {
      snapshot = snapshotCharacter(
        { world: this.options.world, registries: this.options.registries },
        pending.entityId,
        characterId,
        serverTime,
      );
    } catch (error) {
      this.options.logger.warn("persistence", "Character snapshot failed", {
        entityId: pending.entityId,
        characterId,
        message: error instanceof Error ? error.message : String(error),
      });
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
    const save = this.options.persistence
      .saveCharacter(snapshot)
      .catch((error: unknown) => {
        this.options.logger.warn("persistence", "Character save failed", {
          entityId: pending.entityId,
          characterId,
          message: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        this.inFlight.delete(save);
      });
    this.inFlight.add(save);
  }
}

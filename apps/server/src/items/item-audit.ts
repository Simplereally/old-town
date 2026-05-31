import {
  type EntityId,
  type ItemTransactionAuditEvent,
  type ItemTransactionAuditRecord,
  parseItemTransactionAuditRecord,
} from "@old-town/shared";
import type { Logger } from "../logger";

export type ItemTransactionReason =
  | "starter_item"
  | "inventory_drop"
  | "equipment_equip"
  | "equipment_swap_out"
  | "equipment_unequip"
  | "consume"
  | "ground_drop_spawn"
  | "ground_pickup"
  | "ground_despawn"
  | "quest_effect"
  | "quest_reward"
  | "quest_consume"
  | "skilling_gather"
  | "skilling_process_input"
  | "skilling_process_output"
  | "spell_bead_cost";

export type ItemAuditMetadata = NonNullable<ItemTransactionAuditEvent["metadata"]>;

export interface ItemAuditSink {
  recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void>;
}

export interface ItemAuditLogOptions {
  readonly persistence?: ItemAuditSink;
  readonly logger?: Pick<Logger, "debug" | "warn">;
  readonly resolveCharacterId?: (entityId: EntityId) => string | undefined;
}

export type ItemAuditInput = Omit<ItemTransactionAuditEvent, "reason" | "metadata"> & {
  readonly reason: ItemTransactionReason | string;
  readonly metadata?: ItemAuditMetadata;
};

export type EntityItemAuditInput = Omit<ItemAuditInput, "characterId"> & {
  readonly characterId?: string;
};

export class ItemAuditLog {
  private nextId = 1;
  private readonly entries: ItemTransactionAuditRecord[] = [];
  private readonly inFlight = new Set<Promise<void>>();
  private resolveCharacterId: ((entityId: EntityId) => string | undefined) | undefined;

  constructor(private readonly options: ItemAuditLogOptions = {}) {
    this.resolveCharacterId = options.resolveCharacterId;
  }

  setCharacterResolver(resolveCharacterId: (entityId: EntityId) => string | undefined): void {
    this.resolveCharacterId = resolveCharacterId;
  }

  record(event: ItemAuditInput): ItemTransactionAuditRecord {
    const record = parseItemTransactionAuditRecord({
      id: this.nextId,
      ...event,
      metadata: event.metadata ?? {},
    });
    this.nextId += 1;
    this.entries.push(record);
    this.options.logger?.debug("item-audit", "Recorded item transaction", {
      id: record.id,
      tick: record.tick,
      characterId: record.characterId,
      itemId: record.itemId,
      quantity: record.quantity,
      reason: record.reason,
      beforeQuantity: record.beforeQuantity,
      afterQuantity: record.afterQuantity,
    });

    if (this.options.persistence) {
      let write: Promise<void>;
      write = this.options.persistence
        .recordItemTransaction(record)
        .catch((error: unknown) => {
          this.options.logger?.warn("item-audit", "Failed to persist item transaction", {
            id: record.id,
            characterId: record.characterId,
            itemId: record.itemId,
            reason: record.reason,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          this.inFlight.delete(write);
        });
      this.inFlight.add(write);
    }

    return record;
  }

  recordForEntity(
    entityId: EntityId | undefined,
    event: EntityItemAuditInput,
  ): ItemTransactionAuditRecord {
    const metadata: ItemAuditMetadata = {
      ...(event.metadata ?? {}),
      ...(entityId !== undefined ? { actorEntityId: entityId } : {}),
    };
    return this.record({
      ...event,
      characterId: event.characterId ?? this.characterIdFor(entityId),
      metadata,
    });
  }

  recent(limit = 50): readonly ItemTransactionAuditRecord[] {
    const safeLimit = Math.max(0, Math.floor(limit));
    return this.entries.slice(Math.max(0, this.entries.length - safeLimit));
  }

  snapshot(): readonly ItemTransactionAuditRecord[] {
    return [...this.entries];
  }

  async flush(): Promise<void> {
    while (this.inFlight.size > 0) {
      await Promise.all(Array.from(this.inFlight));
    }
  }

  private characterIdFor(entityId: EntityId | undefined): string {
    if (entityId === undefined) {
      return "world";
    }
    return this.resolveCharacterId?.(entityId) ?? `entity:${entityId}`;
  }
}

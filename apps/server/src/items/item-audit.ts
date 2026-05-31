import type { EntityId } from "@old-town/shared";

export type ItemTransactionKind = "drop_spawn" | "ground_pickup" | "ground_despawn";

export interface ItemTransactionRecord {
  readonly id: number;
  readonly kind: ItemTransactionKind;
  readonly tick: number;
  readonly itemId: string;
  readonly quantity: number;
  readonly actorId?: EntityId;
  readonly sourceEntityId?: EntityId;
  readonly groundItemEntityId?: EntityId;
  readonly ownerId?: EntityId;
}

export class ItemAuditLog {
  private nextId = 1;
  private readonly entries: ItemTransactionRecord[] = [];

  record(event: Omit<ItemTransactionRecord, "id">): ItemTransactionRecord {
    const record = { id: this.nextId, ...event };
    this.nextId += 1;
    this.entries.push(record);
    return record;
  }

  snapshot(): readonly ItemTransactionRecord[] {
    return [...this.entries];
  }
}

/**
 * Entity ID allocation and recycling. Uses a monotonically increasing counter with a
 * free-list for reuse. Entity IDs are stable for the lifetime of the entity and never
 * change.
 */
import { type EntityId, entityId } from "@old-town/shared";

export class EntityPool {
  private nextId = 0;
  private freeList: number[] = [];
  private alive = new Set<number>();

  allocate(): EntityId {
    const reused = this.freeList.pop();
    const raw = reused ?? this.nextId++;
    this.alive.add(raw);
    return entityId(raw);
  }

  release(id: EntityId): void {
    const raw = id as number;
    if (!this.alive.has(raw)) {
      throw new Error(`Cannot release non-existent entity ${raw}`);
    }
    this.alive.delete(raw);
    this.freeList.push(raw);
  }

  isAlive(id: EntityId): boolean {
    return this.alive.has(id as number);
  }

  getAlive(): readonly EntityId[] {
    return Array.from(this.alive).map(entityId);
  }
}

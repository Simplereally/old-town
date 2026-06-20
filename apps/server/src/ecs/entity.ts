/**
 * Entity ID allocation and recycling. Uses a monotonically increasing counter with a
 * free-list for reuse. Entity IDs are stable for the lifetime of the entity and never
 * change.
 */
import { type EntityId, entityId } from "@old-town/shared";

export class EntityPool {
  private nextId = 0;
  private freeList: EntityId[] = [];
  private alive = new Set<EntityId>();

  allocate(): EntityId {
    const reused = this.freeList.pop();
    const raw = reused ?? entityId(this.nextId++);
    this.alive.add(raw);
    return raw;
  }

  release(id: EntityId): void {
    if (!this.alive.has(id)) {
      throw new Error(`Cannot release non-existent entity ${id}`);
    }
    this.alive.delete(id);
    this.freeList.push(id);
  }

  isAlive(id: EntityId): boolean {
    return this.alive.has(id);
  }

  getAlive(): readonly EntityId[] {
    return Array.from(this.alive);
  }
}

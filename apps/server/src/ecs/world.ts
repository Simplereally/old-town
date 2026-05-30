/**
 * ECS world state container. Stores components in dense maps keyed by entity id.
 * Provides create/destroy lifecycle, component queries, and isolation guarantees.
 */
import type { EntityId } from "@old-town/shared";
import type {
  ActorComponent,
  CombatantComponent,
  EquipmentComponent,
  GroundItemComponent,
  InventoryComponent,
  MovementComponent,
  NpcComponent,
  ObjectComponent,
  PlayerComponent,
  PositionComponent,
  QuestVarsComponent,
  ResourceNodeComponent,
} from "./components";
import { EntityPool } from "./entity";

export interface ComponentStores {
  position: Map<EntityId, PositionComponent>;
  movement: Map<EntityId, MovementComponent>;
  actor: Map<EntityId, ActorComponent>;
  player: Map<EntityId, PlayerComponent>;
  npc: Map<EntityId, NpcComponent>;
  object: Map<EntityId, ObjectComponent>;
  groundItem: Map<EntityId, GroundItemComponent>;
  inventory: Map<EntityId, InventoryComponent>;
  equipment: Map<EntityId, EquipmentComponent>;
  combatant: Map<EntityId, CombatantComponent>;
  resourceNode: Map<EntityId, ResourceNodeComponent>;
  questVars: Map<EntityId, QuestVarsComponent>;
}

export interface World {
  readonly entities: EntityPool;
  readonly stores: ComponentStores;
  createEntity(): EntityId;
  destroyEntity(id: EntityId): void;
  isAlive(id: EntityId): boolean;
  query<T>(store: Map<EntityId, T>): readonly T[];
  queryAlive<T>(store: Map<EntityId, T>): readonly T[];
}

export function createWorld(): World {
  const entities = new EntityPool();
  const stores: ComponentStores = {
    position: new Map(),
    movement: new Map(),
    actor: new Map(),
    player: new Map(),
    npc: new Map(),
    object: new Map(),
    groundItem: new Map(),
    inventory: new Map(),
    equipment: new Map(),
    combatant: new Map(),
    resourceNode: new Map(),
    questVars: new Map(),
  };

  const createEntity = (): EntityId => {
    return entities.allocate();
  };

  const destroyEntity = (id: EntityId): void => {
    if (!entities.isAlive(id)) {
      throw new Error(`Cannot destroy non-existent entity ${id}`);
    }
    // Remove all components for this entity.
    for (const store of Object.values(stores)) {
      store.delete(id);
    }
    entities.release(id);
  };

  const isAlive = (id: EntityId): boolean => {
    return entities.isAlive(id);
  };

  const query = <T>(store: Map<EntityId, T>): readonly T[] => {
    return Array.from(store.values());
  };

  const queryAlive = <T>(store: Map<EntityId, T>): readonly T[] => {
    const results: T[] = [];
    for (const [id, component] of store) {
      if (entities.isAlive(id)) {
        results.push(component);
      }
    }
    return results;
  };

  return {
    entities,
    stores,
    createEntity,
    destroyEntity,
    isAlive,
    query,
    queryAlive,
  };
}

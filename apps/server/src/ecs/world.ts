import type { EntityId } from "@old-town/shared";
import type {
  ActorComponent,
  BankComponent,
  CharterComponent,
  CombatantComponent,
  ContractComponent,
  DeedComponent,
  DialogueComponent,
  DoorStateComponent,
  EquipmentComponent,
  GraveComponent,
  GroundItemComponent,
  InventoryComponent,
  MovementComponent,
  NpcComponent,
  ObjectComponent,
  PlayerComponent,
  PositionComponent,
  PrayerComponent,
  PublicWorkComponent,
  ResourceNodeComponent,
  ShopComponent,
  SkillsComponent,
  StatusEffectComponent,
  StatusEffectsComponent,
  VarComponent,
} from "./components";
import { EntityPool } from "./entity";

export type WorldComponentMap = {
  position: PositionComponent;
  movement: MovementComponent;
  actor: ActorComponent;
  player: PlayerComponent;
  npc: NpcComponent;
  object: ObjectComponent;
  groundItem: GroundItemComponent;
  grave: GraveComponent;
  doorState: DoorStateComponent;
  inventory: InventoryComponent;
  bank: BankComponent;
  equipment: EquipmentComponent;
  skills: SkillsComponent;
  combatant: CombatantComponent;
  resourceNode: ResourceNodeComponent;
  vars: VarComponent;
  dialogue: DialogueComponent;
  shop: ShopComponent;
  contract: ContractComponent;
  deed: DeedComponent;
  charter: CharterComponent;
  prayer: PrayerComponent;
  publicWork: PublicWorkComponent;
  statusEffects: StatusEffectsComponent;
  statusEffect: StatusEffectComponent;
};

export type WorldComponentKind = keyof WorldComponentMap;

export type WorldComponent<K extends WorldComponentKind> = WorldComponentMap[K];

export interface World {
  createEntity(): EntityId;
  destroyEntity(id: EntityId): void;
  isAlive(id: EntityId): boolean;
  aliveEntityIds(): readonly EntityId[];
  aliveEntityCount(): number;

  getComponent<K extends WorldComponentKind>(
    entityId: EntityId,
    kind: K,
  ): WorldComponent<K> | undefined;

  setComponent<K extends WorldComponentKind>(
    entityId: EntityId,
    kind: K,
    component: WorldComponent<K>,
  ): void;

  removeComponent<K extends WorldComponentKind>(entityId: EntityId, kind: K): boolean;

  hasComponent<K extends WorldComponentKind>(entityId: EntityId, kind: K): boolean;

  componentCount(kind: WorldComponentKind): number;

  entityIdsWith(kind: WorldComponentKind): readonly EntityId[];

  componentEntries<K extends WorldComponentKind>(
    kind: K,
  ): readonly (readonly [EntityId, WorldComponent<K>])[];
}

function entityOrder(a: EntityId, b: EntityId): number {
  return (a as number) - (b as number);
}

export function createWorld(): World {
  const entities = new EntityPool();
  const componentTables: { [K in WorldComponentKind]: Map<EntityId, WorldComponent<K>> } = {
    position: new Map(),
    movement: new Map(),
    actor: new Map(),
    player: new Map(),
    npc: new Map(),
    object: new Map(),
    groundItem: new Map(),
    grave: new Map(),
    doorState: new Map(),
    inventory: new Map(),
    bank: new Map(),
    equipment: new Map(),
    skills: new Map(),
    combatant: new Map(),
    resourceNode: new Map(),
    vars: new Map(),
    dialogue: new Map(),
    shop: new Map(),
    contract: new Map(),
    deed: new Map(),
    charter: new Map(),
    prayer: new Map(),
    publicWork: new Map(),
    statusEffects: new Map(),
    statusEffect: new Map(),
  };

  const allStores: readonly Map<EntityId, unknown>[] = [
    componentTables.position,
    componentTables.movement,
    componentTables.actor,
    componentTables.player,
    componentTables.npc,
    componentTables.object,
    componentTables.groundItem,
    componentTables.grave,
    componentTables.doorState,
    componentTables.inventory,
    componentTables.bank,
    componentTables.equipment,
    componentTables.skills,
    componentTables.combatant,
    componentTables.resourceNode,
    componentTables.vars,
    componentTables.dialogue,
    componentTables.shop,
    componentTables.contract,
    componentTables.deed,
    componentTables.charter,
    componentTables.prayer,
    componentTables.publicWork,
    componentTables.statusEffects,
    componentTables.statusEffect,
  ];

  const createEntity = (): EntityId => {
    return entities.allocate();
  };

  const destroyEntity = (id: EntityId): void => {
    if (!entities.isAlive(id)) {
      throw new Error(`Cannot destroy non-existent entity ${id}`);
    }
    for (const store of allStores) {
      store.delete(id);
    }
    entities.release(id);
  };

  const isAlive = (id: EntityId): boolean => {
    return entities.isAlive(id);
  };

  const aliveEntityIds = (): readonly EntityId[] => {
    return entities.getAlive().toSorted(entityOrder);
  };

  const aliveEntityCount = (): number => {
    return entities.getAlive().length;
  };

  const getComponent = <K extends WorldComponentKind>(
    entityId: EntityId,
    kind: K,
  ): WorldComponent<K> | undefined => {
    return componentTables[kind].get(entityId);
  };

  const setComponent = <K extends WorldComponentKind>(
    entityId: EntityId,
    kind: K,
    component: WorldComponent<K>,
  ): void => {
    if (!entities.isAlive(entityId)) {
      throw new Error(`Cannot set component on dead entity ${entityId}`);
    }
    if (component.entityId !== entityId) {
      throw new Error(`Component entityId mismatch: ${component.entityId} !== ${entityId}`);
    }
    componentTables[kind].set(entityId, component);
  };

  const removeComponent = <K extends WorldComponentKind>(entityId: EntityId, kind: K): boolean => {
    return componentTables[kind].delete(entityId);
  };

  const hasComponent = <K extends WorldComponentKind>(entityId: EntityId, kind: K): boolean => {
    return componentTables[kind].has(entityId);
  };

  const componentCount = (kind: WorldComponentKind): number => {
    return componentTables[kind].size;
  };

  const entityIdsWith = (kind: WorldComponentKind): readonly EntityId[] => {
    return Array.from(componentTables[kind].keys()).toSorted(entityOrder);
  };

  const componentEntries = <K extends WorldComponentKind>(
    kind: K,
  ): readonly (readonly [EntityId, WorldComponent<K>])[] => {
    return Array.from(componentTables[kind].entries()).toSorted((a, b) => entityOrder(a[0], b[0]));
  };

  return {
    createEntity,
    destroyEntity,
    isAlive,
    aliveEntityIds,
    aliveEntityCount,
    getComponent,
    setComponent,
    removeComponent,
    hasComponent,
    componentCount,
    entityIdsWith,
    componentEntries,
  };
}

/**
 * Component definitions for the ECS world. Every component is a plain data object with
 * no methods. The world stores these in dense arrays indexed by entity slot.
 */
import type {
  CombatBonuses,
  Direction,
  EntityId,
  EquipmentSlotName,
  PlayerVarValue,
  SpellDef,
  TileCoord,
} from "@old-town/shared";

/** Position in tile coordinates (integer world truth). */
export interface PositionComponent {
  entityId: EntityId;
  x: number;
  y: number;
  plane: number;
}

export type MovementMode = "walk" | "run";

/** Movement state: current path, speed mode, and deterministic blocking state. */
export interface MovementComponent {
  entityId: EntityId;
  mode: MovementMode;
  path: readonly TileCoord[];
  destination?: TileCoord;
  lastStepDirection?: Direction;
  blockedUntilTick?: number;
}

/** Base actor properties (name, level, appearance). */
export interface ActorComponent {
  entityId: EntityId;
  name: string;
  level: number;
  appearanceId: string;
}

/** Player-specific data (account, session, interest area). */
export interface PlayerComponent {
  entityId: EntityId;
  accountId: string;
  sessionId: string;
  interestRadius: number;
  spellbook?: SpellDef["spellbook"];
}

/** NPC-specific data (type, brain state, respawn). */
export type NpcBrainState =
  | "idle"
  | "wander"
  | "aggro"
  | "chase"
  | "attack"
  | "returnHome"
  | "dead"
  | "respawning";

export interface NpcComponent {
  entityId: EntityId;
  npcId: string;
  brainState: NpcBrainState;
  respawnTick: number;
  wanderRadius: number;
  home?: TileCoord;
  leashDistance?: number;
  occupiedTile?: TileCoord;
}

/** World object (tree, rock, door, etc.). */
export interface ObjectComponent {
  entityId: EntityId;
  objectId: string;
  facing: number;
  variant: number;
}

/** Ground item spawn or drop. `itemId` is a content definition id, not the runtime entity id. */
export interface GroundItemComponent {
  entityId: EntityId;
  itemId: string;
  quantity: number;
  ownerId?: EntityId;
  publicAtTick?: number;
  despawnTick?: number;
}

/**
 * A single occupied inventory slot. `uid` is a per-container instance id assigned when an
 * item first enters the container; it travels with the item across moves/swaps so the
 * client can reference a specific stack in item-option commands (`itemUid`).
 */
export interface InventorySlot {
  itemId: string;
  quantity: number;
  uid: number;
  /** Current durability, only present for items that can degrade. */
  durability?: number;
}

/**
 * Inventory container (slotted items). Plain data — all mutation logic lives in
 * `items/inventory.ts`. `slots` is length `capacity`; `undefined` marks an empty slot.
 */
export interface InventoryComponent {
  entityId: EntityId;
  containerId: string;
  capacity: number;
  slots: (InventorySlot | undefined)[];
  /** Monotonic allocator for slot `uid`s (starts at 1). */
  nextUid: number;
}

/**
 * Worn equipment. `slots` maps a canonical slot name (POC_SPEC §16.3) to the equipped item id;
 * `bonuses` is the aggregated combat bonus sum, recomputed only on equip/unequip (§16.4) so the
 * combat loop never re-sums per tick. Mutation logic lives in `items/equipment.ts`.
 */
export interface EquipmentComponent {
  entityId: EntityId;
  slots: Partial<Record<EquipmentSlotName, string>>;
  bonuses: CombatBonuses;
}

export interface SkillState {
  level: number;
  xp: number;
  /** Temporary boost above base level (e.g. from potions). */
  boost: number;
  /** Temporary drain below base level (e.g. from spells). */
  drain: number;
}

export interface SkillsComponent {
  entityId: EntityId;
  skills: Record<string, SkillState>;
}

export type CombatHitStyle = "stab" | "slash" | "crush" | "ranged" | "magic";

export interface PendingHit {
  sourceId: EntityId;
  targetId: EntityId;
  applyTick: number;
  style: CombatHitStyle;
  attackRoll: number;
  defenceRoll: number;
  hitChance: number;
  maxHit: number;
  damage: number;
  hitLanded: boolean;
}

/** Combat stats and state. */
export interface CombatantComponent {
  entityId: EntityId;
  health: number;
  maxHealth: number;
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  targetId: EntityId | undefined;
  attackCooldown: number;
  combatLevel: number;
  eatBlockedUntilTick: number;
  autoRetaliate?: boolean;
  nextAttackTick?: number;
  dead?: boolean;
  respawnTick?: number;
  lastDamageSourceId?: EntityId | undefined;
  spellCooldowns?: Record<string, number>;
  pendingHits?: PendingHit[];
}

/** Resource node (tree, rock, fishing spot). */
export interface ResourceNodeComponent {
  entityId: EntityId;
  nodeId: string;
  active?: boolean;
  depleted: boolean;
  respawnTick: number;
}

/** Generic player vars for quest progress, unlocks, and persistent world state. */
export interface VarComponent {
  entityId: EntityId;
  values: Record<string, PlayerVarValue>;
}

/** Transient active dialogue state for a player. Persistent quest state stays in vars. */
export interface DialogueComponent {
  entityId: EntityId;
  dialogueId: string;
  nodeId: string;
  speakerName: string;
  speakerEntityId?: EntityId;
}

export interface ShopStockEntry {
  itemId: string;
  quantity: number;
  maxQuantity: number;
  price: number;
  restockRate: number;
}

export interface ShopComponent {
  entityId: EntityId;
  shopId: string;
  stock: ShopStockEntry[];
  lastRestockTick: number;
}

/**
 * Bank container (slotted items). Same shape as InventoryComponent but stored
 * under a separate component kind so a player can hold both inventory and bank.
 */
export interface BankComponent {
  entityId: EntityId;
  containerId: string;
  capacity: number;
  slots: (InventorySlot | undefined)[];
  /** Monotonic allocator for slot `uid`s (starts at 1). */
  nextUid: number;
}

export interface ContractObjective {
  readonly kind: string;
  readonly targetId: string;
  readonly required: number;
  readonly current: number;
}

export type ContractStatus = "available" | "accepted" | "ready-for-completion" | "completed" | "expired";

export interface ActiveStatusEffect {
  statusEffectId: string;
  sourceEntityId?: EntityId | undefined;
  stacks: number;
  remainingTicks: number;
}

export interface StatusEffectsComponent {
  entityId: EntityId;
  effects: ActiveStatusEffect[];
  baseAttackLevel?: number;
  baseStrengthLevel?: number;
  baseDefenceLevel?: number;
}

/** Wardenry contract state on a board or player. */
export interface ContractComponent {
  entityId: EntityId;
  contractId: string;
  status: ContractStatus;
  objectives: ContractObjective[];
  startTick: number;
  expiryTick: number;
}

export interface Deed {
  id: string;
  propertyId: string;
  ownerId: EntityId;
  issuedTick: number;
  expiryTick: number;
  transferable: boolean;
}

/** Ledger deed state on a player entity. */
export interface DeedComponent {
  entityId: EntityId;
  deeds: Deed[];
}

/** A grave that stores a dead player's dropped items. */
export interface GraveComponent {
  entityId: EntityId;
  playerId: EntityId;
  items: InventorySlot[];
  despawnTick: number;
}

/** Door or chest open/close state. */
export interface DoorStateComponent {
  entityId: EntityId;
  isOpen: boolean;
  openDuration?: number;
  linkedDoorId?: EntityId;
}

/** A permit issued by a charter system. */
export interface Permit {
  charterId: string;
  issuedTick: number;
  expiryTick: number;
}

/** Charter permit state on a player entity. */
export interface CharterComponent {
  entityId: EntityId;
  permits: Permit[];
}

/** A single active effect entry in the new status-effect component. */
export interface ActiveEffect {
  effectId: string;
  durationTicks: number;
  damagePerTick?: number;
  healPerTick?: number;
  statModifiers?: Record<string, number>;
}

/** New status-effect component (flat shape per spec). */
export interface StatusEffectComponent {
  entityId: EntityId;
  activeEffects: ActiveEffect[];
  baseStats?: {
    attackLevel: number;
    strengthLevel: number;
    defenceLevel: number;
  };
}

/** A single resource requirement for a public work. */
export interface PublicWorkResource {
  itemId: string;
  quantity: number;
}

/** A single contribution by a player to a public work. */
export interface PublicWorkContributor {
  playerId: EntityId;
  itemId: string;
  quantity: number;
}

/** A collective community building project. */
export interface PublicWorkComponent {
  entityId: EntityId;
  publicWorkId: string;
  name: string;
  requiredResources: PublicWorkResource[];
  currentResources: PublicWorkResource[];
  contributors: PublicWorkContributor[];
  completed: boolean;
  rewardsDistributed?: boolean;
  rewardItems?: { itemId: string; quantity: number }[];
  rewardXp?: { skillId: string; amount: number }[];
  worldChange?: string;
}
